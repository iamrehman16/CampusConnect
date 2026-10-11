import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig, loadEnv } from "vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Workbox writes each runtimeCaching urlPattern into sw.js as source text, so a
  // matcher function that reads `env` throws "env is not defined" inside the
  // worker and API responses are never cached. A RegExp is written out by value.
  const apiOrigin = env.VITE_API_BASE_URL ?? "";
  const apiPattern = new RegExp(`^${apiOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/api/`);

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "prompt",
        includeAssets: ["icons/*"],
        manifest: false,
        workbox: {
          // On a first visit the worker installs and precaches but would not
          // control the already-open page until a reload, so going offline
          // right away broke every not-yet-loaded route chunk (BACKLOG.md J3).
          // Safe with registerType "prompt": updates still wait for the user.
          clientsClaim: true,
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          runtimeCaching: [
            {
              // RegExp routes match GET requests only (Workbox's default method).
              urlPattern: apiPattern,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "api-get-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com/,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "google-fonts-stylesheets" },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com/,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-webfonts",
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
            {
              urlPattern: /^https:\/\/res\.cloudinary\.com/,
              handler: "CacheFirst",
              options: {
                cacheName: "cloudinary-images",
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api/],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],

    // ── kept from original ──────────────────────────────────────────
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:3100",
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("Accept-Encoding", "identity");
            });
          },
        },
      },
    },
  };
});
