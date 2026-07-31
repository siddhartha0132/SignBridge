import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Frontend dev server proxies API calls to the local Express backend
// (server/index.js) so the Anthropic API key never reaches the browser.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
});
