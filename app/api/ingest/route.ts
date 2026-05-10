import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromPDF, chunkText } from '@/lib/chunker'
import { generateEmbedding } from '@/lib/huggingface'
import { hasValidAdminSession } from '@/lib/admin-auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const maxDuration = 300

const MAX_PDF_BYTES = 10 * 1024 * 1024

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.\- ()]/g, '_').slice(0, 120) || 'document.pdf'
}

export async function POST(req: NextRequest) {
  try {
    if (!hasValidAdminSession(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ip = getClientIp(req)
    const limit = checkRateLimit(`ingest:${ip}`, 5, 15 * 60 * 1000)

    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many ingestion requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(limit.retryAfter) },
        }
      )
    }

    const contentLength = Number(req.headers.get('content-length') || 0)
    if (contentLength > MAX_PDF_BYTES) {
      return NextResponse.json({ error: 'PDF is too large' }, { status: 413 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const filename = sanitizeFilename(file.name)
    const isPdf =
      file.type === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')

    if (!isPdf) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: 'PDF is too large' }, { status: 413 })
    }

    // Read PDF buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (buffer.length > MAX_PDF_BYTES) {
      return NextResponse.json({ error: 'PDF is too large' }, { status: 413 })
    }

    console.log(`[ingest] PDF size: ${buffer.length} bytes`)

    // Extract text
    const text = await extractTextFromPDF(buffer)
    console.log(`[ingest] Extracted text length: ${text.length} chars`)

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: `Could not extract text from PDF (got ${text?.length ?? 0} chars)` },
        { status: 400 }
      )
    }

    // Chunk the text
    const chunks = chunkText(text, 600, 100)
    console.log(`[ingest] Total chunks: ${chunks.length}`)

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'Text was extracted but produced 0 chunks. Check chunker.' },
        { status: 400 }
      )
    }

    // Clear existing documents
    await supabaseAdmin.from('documents').delete().neq('id', 0)

    // Embed and store each chunk
    let successful = 0
    let failed = 0

    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await generateEmbedding(chunks[i])
        console.log(`[ingest] Chunk ${i}: embedding dim=${embedding.length}`)

        const { error } = await supabaseAdmin.from('documents').insert({
          content: chunks[i],
          embedding,
          metadata: {
            source: filename,
            chunk_index: i,
            total_chunks: chunks.length,
          },
        })
        if (error) {
          console.error(`[ingest] Supabase insert error for chunk ${i}:`, error)
          failed++
        } else {
          successful++
        }
      } catch (err) {
        console.error(`[ingest] Failed to embed chunk ${i}:`, err)
        failed++
      }

      // Avoid HF rate limits
      await new Promise((r) => setTimeout(r, 300))
    }

    return NextResponse.json({
      message: 'Ingestion complete',
      total_chunks: chunks.length,
      embedded: successful,
      failed,
    })
  } catch (err) {
    console.error('[ingest] Fatal error:', err)
    return NextResponse.json(
      { error: 'Ingestion failed. Please check the server logs.' },
      { status: 500 }
    )
  }
}
