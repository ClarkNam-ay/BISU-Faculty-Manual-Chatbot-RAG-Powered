import { supabaseAdmin } from './supabase-admin'
import { generateEmbedding } from './huggingface'

/**
 * Perform semantic similarity search against stored document chunks
 */
export async function retrieveRelevantChunks(
  query: string,
  topK = 8
): Promise<{ content: string; similarity: number }[]> {
  const queryEmbedding = await generateEmbedding(query)

  const { data, error } = await supabaseAdmin.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.3,
    match_count: topK,
  })

  if (error) {
    console.error('Supabase search error:', error)
    throw new Error(`Vector search failed: ${error.message}`)
  }

  return (data ?? []) as { content: string; similarity: number }[]
}
