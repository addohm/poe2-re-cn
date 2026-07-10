import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static SPA. `base: "./"` keeps asset paths relative so it deploys under any
// host/path (Cloudflare Pages, Netlify, subfolder) without rewrites.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
