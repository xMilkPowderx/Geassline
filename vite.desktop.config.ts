import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const workspace = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(workspace, "desktop/electron"),
  base: "./",
  publicDir: resolve(workspace, "public"),
  build: {
    outDir: resolve(workspace, "desktop/electron/ui"),
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
    cssMinify: false,
  },
  resolve: {
    alias: { "@": resolve(workspace, "src") },
  },
  server: {
    fs: { allow: [workspace] },
  },
  plugins: [tailwindcss(), viteReact()],
});
