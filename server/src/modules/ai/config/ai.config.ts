import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  groqApiKey: process.env.GROQ_API_KEY,
  models: {
    reasoning: process.env.GROQ_REASONING_MODEL || 'llama-3.3-70b-versatile',
    fast: process.env.GROQ_FAST_MODEL || 'llama-3.1-8b-instant',
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
  geminiApiKey: process.env.GEMINI_API_KEY,
  llamaCloudApiKey: process.env.LLAMA_CLOUD_API_KEY,
}));
