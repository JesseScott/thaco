import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the build works from a subpath (e.g. GitHub Pages)
  base: "./",
  server: {
    cors: {
      origin: "https://www.owlbear.rodeo",
    },
  },
});