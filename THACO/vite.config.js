import { readFile, writeFile } from "node:fs/promises";
import { defineConfig } from "vite";

// Owlbear does not resolve relative manifest paths against the manifest URL,
// so when SITE_URL is set (e.g. https://user.github.io/thaco) the built
// manifest is rewritten with absolute URLs. Without it, the dev-friendly
// root-relative paths from public/manifest.json are kept.
function absoluteManifestUrls() {
  return {
    name: "absolute-manifest-urls",
    apply: "build",
    async closeBundle() {
      const siteUrl = process.env.SITE_URL;
      if (!siteUrl) return;
      const base = siteUrl.replace(/\/+$/, "") + "/";
      const absolute = (path) => new URL(path.replace(/^\/+/, ""), base).href;
      const file = "dist/manifest.json";
      const manifest = JSON.parse(await readFile(file, "utf8"));
      manifest.action.icon = absolute(manifest.action.icon);
      manifest.action.popover = absolute(manifest.action.popover || "/");
      await writeFile(file, JSON.stringify(manifest, null, 2) + "\n");
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the build works from a subpath (e.g. GitHub Pages)
  base: "./",
  plugins: [absoluteManifestUrls()],
  server: {
    cors: {
      origin: "https://www.owlbear.rodeo",
    },
  },
});
