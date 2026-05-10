const EMBEDDING_MODEL =
  process.env.HF_EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

/**
 * Generate an embedding vector for a given text using Hugging Face Inference API
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const hfApiKey = requireEnv("HUGGINGFACE_API_KEY");

  // Correct HF Inference API URL for feature extraction / sentence similarity
  const response = await fetch(
    `https://router.huggingface.co/hf-inference/models/${EMBEDDING_MODEL}/pipeline/feature-extraction`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        options: { wait_for_model: true, use_cache: true },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("HF Embedding API error:", response.status, error.slice(0, 500));
    throw new Error("Embedding service failed");
  }

  const result = await response.json();

  // all-MiniLM-L6-v2 returns shape [1, tokens, 384] or [tokens, 384] or flat [384]
  // We need to mean-pool down to a flat [384] vector
  if (Array.isArray(result)) {
    // Shape [1, tokens, 384] — unwrap outer dimension
    if (Array.isArray(result[0]) && Array.isArray(result[0][0])) {
      return meanPool(result[0] as number[][]);
    }
    // Shape [tokens, 384]
    if (Array.isArray(result[0])) {
      return meanPool(result as number[][]);
    }
    // Already flat [384]
    return result as number[];
  }

  throw new Error("Unexpected embedding response shape from HF API");
}

function meanPool(embeddings: number[][]): number[] {
  const dim = embeddings[0].length;
  const mean = new Array(dim).fill(0);
  for (const vec of embeddings) {
    for (let i = 0; i < dim; i++) {
      mean[i] += vec[i];
    }
  }
  return mean.map((v) => v / embeddings.length);
}

/**
 * Generate a RAG answer using Hugging Face Inference API (text generation)
 */
export async function generateAnswer(
  question: string,
  context: string,
): Promise<ReadableStream<Uint8Array>> {
  const groqApiKey = requireEnv("GROQ_API_KEY");

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: `You are an expert assistant for Bohol Island State University (BISU) Faculty Manual.

Rules:
- Answer using ONLY the provided context. Never guess or use outside knowledge.
- Give complete, detailed answers. Explain fully, do not just quote a phrase.
- If the context contains a list or table, present it clearly with line breaks.
- If numbers or specific values are mentioned, always include them in your answer.
- If the context does not contain the answer, say exactly: "The BISU Faculty Manual does not appear to cover that topic in the indexed sections."
- Never say "based on the context" — just answer directly as a BISU expert.`,
          },
          {
            role: "user",
            content: `CONTEXT FROM BISU FACULTY MANUAL:\n${"─".repeat(40)}\n${context}\n${"─".repeat(40)}\n\nQUESTION: ${question}\n\nProvide a complete and accurate answer:`,
          },
        ],
        max_tokens: 512,
        temperature: 0.3,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("LLM API error:", response.status, error.slice(0, 500));
    throw new Error("Answer service failed");
  }

  const result = await response.json();
  const answer: string =
    result.choices?.[0]?.message?.content ??
    "I don't have enough information in the manual to answer that.";

  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(answer));
      controller.close();
    },
  });
}
