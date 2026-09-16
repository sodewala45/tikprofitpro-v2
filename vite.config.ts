import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { SITE, OG_IMAGE, routeMeta } from "./seo-routes";

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Emits a static HTML file per route with unique title/description/canonical and a
 * short unique text block, so crawlers that don't run JavaScript see distinct pages.
 */
function seoPrerender(): Plugin {
  return {
    name: "seo-prerender",
    apply: "build",
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist");
      const indexPath = path.join(outDir, "index.html");
      if (!fs.existsSync(indexPath)) return;
      const template = fs.readFileSync(indexPath, "utf8");

      for (const [route, meta] of Object.entries(routeMeta)) {
        const url = `${SITE}${route}`;
        let html = template
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`)
          .replace(
            /<meta name="description"[^>]*>/,
            `<meta name="description" content="${esc(meta.description)}" />`,
          )
          .replace(
            /<meta property="og:title"[^>]*>/,
            `<meta property="og:title" content="${esc(meta.title)}" />`,
          )
          .replace(
            /<meta property="og:description"[^>]*>/,
            `<meta property="og:description" content="${esc(meta.description)}" />`,
          )
          .replace(
            /<meta property="og:url"[^>]*>/,
            `<meta property="og:url" content="${esc(url)}" />`,
          )
          .replace(
            /<meta name="twitter:title"[^>]*>/,
            `<meta name="twitter:title" content="${esc(meta.title)}" />`,
          )
          .replace(
            /<meta name="twitter:description"[^>]*>/,
            `<meta name="twitter:description" content="${esc(meta.description)}" />`,
          );

        html = html.replace(
          "</head>",
          `  <link rel="canonical" href="${esc(url)}" />\n    <meta property="og:image" content="${esc(OG_IMAGE)}" />\n  </head>`,
        );

        const links = Object.entries(routeMeta)
          .filter(([r]) => r !== route)
          .map(([r, m]) => `<li><a href="${r}">${esc(m.heading)}</a></li>`)
          .join("");

        html = html.replace(
          "</body>",
          `  <noscript><h1>${esc(meta.heading)}</h1><p>${esc(meta.body)}</p><ul>${links}</ul></noscript>\n  </body>`,
        );

        const dir = route === "/" ? outDir : path.join(outDir, route.replace(/^\//, ""));
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "index.html"), html);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    seoPrerender(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
