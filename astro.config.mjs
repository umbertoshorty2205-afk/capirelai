import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://capirelai.com",
  base: "/",
  output: "static",
  integrations: [sitemap(), react()],
  vite: {
    optimizeDeps: {
      exclude: ['three'],
    },
  },
});