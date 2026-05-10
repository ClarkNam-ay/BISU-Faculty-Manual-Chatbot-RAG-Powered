# BISU Faculty Manual RAG Chatbot

A full-stack Retrieval-Augmented Generation chatbot for the BISU Faculty Manual.

- Frontend/backend: Next.js 16 App Router
- Vector database: Supabase with pgvector
- Embeddings: Hugging Face Inference API
- Generation: Groq OpenAI-compatible chat completions
- PDF ingestion: `pdf-parse`

## Setup

### 1. Install

```bash
npm install
```

### 2. Supabase

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run `supabase_setup.sql`.

This creates the `documents` table, pgvector index, and `match_documents` RPC used by the chat route.

### 3. Environment Variables

Create `.env.local` for local development and add the same variables in Vercel Project Settings.

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

HUGGINGFACE_API_KEY=hf_xxx
HF_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

GROQ_API_KEY=gsk_xxx
GROQ_MODEL=llama-3.1-8b-instant

ADMIN_PASSWORD=replace-with-a-long-random-password
ADMIN_SESSION_SECRET=replace-with-a-random-32-byte-secret
```

Important:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public browser values.
- `SUPABASE_SERVICE_ROLE_KEY`, `HUGGINGFACE_API_KEY`, `GROQ_API_KEY`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` must stay server-side only.
- Do not commit `.env.local`.
- Rotate any key that was shared, uploaded, pasted into chat, or exposed in a screenshot.

### 4. Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Usage

1. Open `/admin`.
2. Log in with `ADMIN_PASSWORD`.
3. Upload the BISU Faculty Manual PDF.
4. Return to `/` and ask questions.

Uploading a new PDF replaces the current indexed document chunks.

## Deployment On Vercel

Use these project settings:

- Framework preset: Next.js
- Build command: `npm run build`
- Install command: `npm install`
- Node.js version: 20.x or newer

Add all variables from the environment section in Vercel before deploying.

## Scripts

```bash
npm run lint
npm run build
npm run start
```

## Models

| Purpose | Default |
| --- | --- |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` |
| Generation | `llama-3.1-8b-instant` |

If you change the embedding model, update the `VECTOR(384)` dimension in `supabase_setup.sql` to match the new embedding size, then re-run the SQL and re-ingest the PDF.

## Security Notes

- `/api/ingest` requires a signed, HTTP-only admin session cookie.
- Admin password comparison uses a timing-safe hash comparison.
- Chat and admin endpoints include lightweight per-instance rate limiting.
- Uploads are limited to 10 MB PDFs.
- Raw upstream provider errors are logged server-side but not returned to users.
- For stronger production rate limiting across all Vercel instances, add a durable limiter such as Vercel Firewall/WAF rules, Upstash Redis, or Supabase-backed request logging.
