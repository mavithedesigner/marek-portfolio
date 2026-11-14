// @ts-check
import { rm } from "node:fs/promises";
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

import { PUBLISH_THOUGHTS } from "./src/lib/features";

/**
 * Until Thoughts is published, the production build drops its pages and the
 * RSS feed after building, so nothing about it reaches the live site.
 * Flip PUBLISH_THOUGHTS in src/lib/features.ts to launch.
 * @returns {import("astro").AstroIntegration}
 */
function hideThoughts() {
	return {
		name: "hide-thoughts",
		hooks: {
			"astro:build:done": async ({ dir }) => {
				if (PUBLISH_THOUGHTS) return;
				await rm(new URL("thoughts/", dir), { recursive: true, force: true });
				await rm(new URL("rss.xml", dir), { force: true });
			},
		},
	};
}

const isThoughtsPage = (/** @type {string} */ page) =>
	/\/(thoughts(\/|$)|rss\.xml$)/.test(new URL(page).pathname);

// https://astro.build/config
export default defineConfig({
	// Needed for canonical URLs, absolute og:image paths and the sitemap.
	site: "https://www.vican.design",

	vite: {
		plugins: [tailwindcss()],
	},

	integrations: [
		react(),
		sitemap({ filter: (page) => PUBLISH_THOUGHTS || !isThoughtsPage(page) }),
		hideThoughts(),
	],
});
