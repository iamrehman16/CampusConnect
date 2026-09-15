// utils/generate-id.ts
// Collision-safe enough for ephemeral UI message IDs.
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}