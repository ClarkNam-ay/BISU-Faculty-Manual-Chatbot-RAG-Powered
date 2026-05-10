import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured')
}

// Client for browser use
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type DocumentChunk = {
  id: number
  content: string
  metadata: Record<string, unknown>
  embedding: number[]
  created_at: string
}
