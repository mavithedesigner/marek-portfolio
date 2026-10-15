// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // Needed for canonical URLs, absolute og:image paths and the sitemap.
  site: "https://www.vican.design",

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [react(), sitemap()],
});
