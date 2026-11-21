// @ts-check
import { readFileSync, readdirSync } from "node:fs";
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

/**
 * Last change of each post, by URL, read straight from the Markdown
 * frontmatter (`updated`, else `date`). This file runs outside Vite, so the
 * content collection isn't available here. Search engines use the sitemap's
 * <lastmod> to decide when to re-crawl a post; pages without one are left
 * without, since a guessed date is worse than none.
 */
const thoughtsDir = new URL("./src/content/thoughts/", import.meta.url);
const postLastmod = new Map(
	readdirSync(thoughtsDir)
		.filter((file) => file.endsWith(".md"))
		.map((file) => {
			const text = readFileSync(new URL(file, thoughtsDir), "utf8");
			const field = (/** @type {string} */ name) =>
				text.match(new RegExp(`^${name}:\\s*["']?([\\d-]+)`, "m"))?.[1];
			const date = field("updated") ?? field("date");
			const url = `https://www.vican.design/thoughts/${file.replace(/\.md$/, "")}/`;
			return /** @type {[string, string | undefined]} */ ([url, date]);
		}),
);

// https://astro.build/config
export default defineConfig({
	// Needed for canonical URLs, absolute og:image paths and the sitemap.
	site: "https://www.vican.design",

	vite: {
		plugins: [tailwindcss()],
	},

	integrations: [
		react(),
		sitemap({
			filter: (page) => PUBLISH_THOUGHTS || !isThoughtsPage(page),
			serialize(item) {
				const date = postLastmod.get(item.url);
				if (date) item.lastmod = new Date(date).toISOString();
				return item;
			},
		}),
		hideThoughts(),
	],
});
