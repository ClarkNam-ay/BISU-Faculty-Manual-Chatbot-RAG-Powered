-- ============================================================
-- BISU RAG Chatbot - Supabase Database Setup
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Drop existing table if re-running setup
DROP TABLE IF EXISTS documents;

-- 3. Create documents table
CREATE TABLE documents (
  id          BIGSERIAL PRIMARY KEY,
  content     TEXT        NOT NULL,
  embedding   VECTOR(384),
  metadata    JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create HNSW index for fast cosine similarity search
CREATE INDEX documents_embedding_idx
  ON documents
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 5. Drop ALL overloads of match_documents, then recreate
DROP FUNCTION IF EXISTS match_documents(vector, float, int);
DROP FUNCTION IF EXISTS match_documents(vector(384), float, int);
DROP FUNCTION IF EXISTS match_documents(vector(384), double precision, integer);
DROP FUNCTION IF EXISTS match_documents(vector, double precision, integer);

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(384),
  match_threshold FLOAT DEFAULT 0.3,
  match_count     INT   DEFAULT 5
)
RETURNS TABLE (
  id         BIGINT,
  content    TEXT,
  metadata   JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    (1 - (d.embedding <=> query_embedding))::FLOAT AS similarity
  FROM documents d
  WHERE (1 - (d.embedding <=> query_embedding)) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 6. Row-level security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access"
  ON documents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can read"
  ON documents
  FOR SELECT
  TO anon
  USING (true);