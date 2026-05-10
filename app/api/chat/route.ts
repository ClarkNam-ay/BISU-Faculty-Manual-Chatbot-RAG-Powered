import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantChunks } from '@/lib/retrieval'
import { generateAnswer } from '@/lib/huggingface'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const maxDuration = 60

const MAX_QUESTION_LENGTH = 1000

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const limit = checkRateLimit(`chat:${ip}`, 30, 60 * 1000)

    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many questions. Please wait a moment and try again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(limit.retryAfter) },
        }
      )
    }

    const body = await req.json().catch(() => null)
    const question = body?.question

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 })
    }

    const trimmedQuestion = question.trim()

    if (trimmedQuestion.length === 0) {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 })
    }

    if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json({ error: 'Question is too long' }, { status: 413 })
    }

    // Retrieve relevant chunks via vector similarity
    const chunks = await retrieveRelevantChunks(trimmedQuestion, 5)

    if (chunks.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find relevant information in the BISU Faculty Manual for your question. Please try rephrasing or ask about topics covered in the manual.",
        sources: [],
      })
    }

    // Build context from top chunks
    const context = chunks
      .map((c, i) => `[Excerpt ${i + 1}]:\n${c.content}`)
      .join('\n\n')

    // Generate answer with LLM
    const stream = await generateAnswer(trimmedQuestion, context)

    // Read stream to string
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let answer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      answer += decoder.decode(value)
    }

    return NextResponse.json({
      answer: answer.trim(),
      sources: chunks.map((c) => ({
        content: c.content.slice(0, 200) + '...',
        similarity: Math.round(c.similarity * 100),
      })),
    })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json(
      { error: 'Unable to answer right now. Please try again later.' },
      { status: 500 }
    )
  }
}
