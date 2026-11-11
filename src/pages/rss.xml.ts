import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getThoughts } from "../lib/thoughts";

/**
 * RSS feed for the writing. Readers and newsletter tools pick posts up from
 * here, and it costs nothing to keep current because it is generated from the
 * same files the site is built from.
 */
export async function GET(context: APIContext) {
	const posts = await getThoughts();

	return rss({
		title: "Marek Vicáň — Thoughts",
		description: "Notes on design, branding and working with AI.",
		site: context.site ?? "https://www.vican.design",
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.date,
			link: `/thoughts/${post.id}/`,
			categories: post.data.tags,
		})),
		customData: "<language>en-gb</language>",
	});
}
