/** Must match the API route's cacheName in vite.config.ts (runtimeCaching). */
export const API_CACHE_NAME = "api-get-cache";

/**
 * Drop the service worker's cached API responses. The cache is keyed by URL,
 * not by user, so it must go whenever a session ends or the next person to
 * sign in on this device would be served the previous user's data.
 */
export async function clearOfflineApiCache(): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    await caches.delete(API_CACHE_NAME);
  } catch (err) {
    console.error("Failed to clear the offline API cache", err);
  }
}
