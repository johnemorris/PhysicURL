import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  output: "static",
  site: "https://physicurl.com",
  trailingSlash: "never",
  build: {
    format: "directory",
  },
  integrations: [
    react(),
    sitemap({
      filter: page => !page.endsWith("/resources-index"),
      customPages: ["https://physicurl.com/index"],
    }),
  ],
  vite: {
    resolve: {
      alias: { "@": "/src" },
    },
    define: {
      "import.meta.env.PUBLIC_API_URL": JSON.stringify(
        process.env.PUBLIC_API_URL || "http://localhost:5000",
      ),
    },
  },
});
