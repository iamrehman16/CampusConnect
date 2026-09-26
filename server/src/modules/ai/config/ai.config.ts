import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  groqApiKey: process.env.GROQ_API_KEY,
  // Defaults must be models Groq still serves — it retires ids without
  // notice (llama-3.3-70b-versatile / llama-3.1-8b-instant were dropped,
  // and every call 404'd). `GET https://api.groq.com/openai/v1/models`
  // lists what the key can use.
  models: {
    reasoning: process.env.GROQ_REASONING_MODEL || 'openai/gpt-oss-120b',
    fast: process.env.GROQ_FAST_MODEL || 'qwen/qwen3.8-27b',
    embedding: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  },
  groqTimeoutMs: Number(process.env.GROQ_TIMEOUT_MS) || 30_000,
  // BACKLOG.md B9 — caps buildMessages' assembled prompt so cross-session
  // memory (B6) plus RAG context plus history can't silently exceed the
  // model's context window on a long, memory-heavy thread. Deliberately
  // conservative rather than tied to a specific model's actual window
  // (which varies per GROQ_REASONING_MODEL) — this is a safety net, not a
  // precise budget.
  maxPromptTokens: Number(process.env.GROQ_MAX_PROMPT_TOKENS) || 6000,
  qdrantApiKey: process.env.QDRANT_API_KEY,
  qdrantUrl: process.env.QDRANT_URL,
  // Appended to every Qdrant collection name so environments sharing one
  // cluster (local dev, the deployed app, the H1 demo DB) don't read each
  // other's vectors — a resource ID from one Mongo DB means nothing in
  // another. Empty keeps the original names for the deployed app.
  qdrantCollectionSuffix: process.env.QDRANT_COLLECTION_SUFFIX ?? '',
  geminiApiKey: process.env.GEMINI_API_KEY,
  llamaCloudApiKey: process.env.LLAMA_CLOUD_API_KEY,
}));
