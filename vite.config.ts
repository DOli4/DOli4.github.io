import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
// Root user page (https://doli4.github.io/) → base "/".
export default defineConfig({
  base: "/",
  // Honor an assigned PORT (e.g. the editor's preview harness); vite ignores it otherwise.
  server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : undefined,
  plugins: [react()],
  resolve: {
    // Keep a single React instance — @gsap/react's useGSAP breaks with a duplicate.
    dedupe: ["react", "react-dom", "gsap"],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
