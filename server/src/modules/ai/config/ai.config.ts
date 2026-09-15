import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  groqApiKey: process.env.GROQ_API_KEY,
  models: {
    reasoning: process.env.GROQ_REASONING_MODEL || 'llama-3.3-70b-versatile',
    fast: process.env.GROQ_FAST_MODEL || 'llama-3.1-8b-instant',
    embedding: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  },
  qdrantApiKey: process.env.QDRANT_API_KEY,
  qdrantUrl: process.env.QDRANT_URL,
  geminiApiKey: process.env.GEMINI_API_KEY,
  llamaCloudApiKey: process.env.LLAMA_CLOUD_API_KEY,
}));
