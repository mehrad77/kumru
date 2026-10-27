// Kumru's page build (`pnpm build`): Vite bundles app/main.ts and scripts/vite/page.ts adds the shell, the content
// data, the service worker and the brand files, all into public/ (what the Cloudflare Worker serves as static assets).
// Modes: production (default), drafts, dev (`pnpm seed`); `vite` itself (`pnpm dev`) is the dev server.
import { cloudflare } from "@cloudflare/vite-plugin";
import preact from "@preact/preset-vite";
import { defineConfig } from "vite";
import { kumruPage } from "./scripts/vite/page.ts";

// In dev, Vite serves the assets and does the single-page fallback itself. The Worker's own fallback and its
// `/@*` route (for /@username links) would answer Vite's virtual URLs (/@vite/client, /@id/…) with the page, so those
// are left to Vite. The customizer's result is merged into wrangler.jsonc's, so only the differences go here.
const devConfig = () => ({ assets: { not_found_handling: "none" as const, run_worker_first: ["!/@vite/*", "!/@id/*", "!/@fs/*"] } });

export default defineConfig(({ command, mode }) => ({
  // `vite` (pnpm dev) also runs the Worker in workerd from wrangler.jsonc; `vite build` only builds the page (the Worker deploys with wrangler)
  plugins: [preact(), kumruPage({ mode, serve: command === "serve" }), ...(command === "serve" ? [cloudflare({ config: devConfig })] : [])],
  publicDir: false,
  build: {
    outDir: "public",
    emptyOutDir: false,   // page.ts writes in place and drops stale files itself, so wrangler dev never sees an empty folder
    target: "es2022",
    minify: mode === "dev" ? false : undefined,
    modulePreload: { polyfill: false },
    reportCompressedSize: false,
    rollupOptions: {
      // the page, and the service worker as a second entry that must keep its name (/sw.js, scope /)
      input: { index: "index.html", sw: "app/host/sw.ts" },
      output: {
        entryFileNames: (chunk: { name: string }) => (chunk.name === "sw" ? "sw.js" : "assets/[name]-[hash].js"),
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
}));
