import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Writing lives as plain Markdown files in `src/content/thoughts/`.
 *
 * One file is one post. The block at the top of each file (the frontmatter) is
 * checked against the shape below at build time, so a typo or a missing date
 * fails the build instead of quietly shipping a broken page.
 */
const thoughts = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/thoughts" }),
	schema: ({ image }) =>
		z.object({
			/** Shown as the H1 and in search results. Keep it under ~60 characters. */
			title: z.string(),
			/** One sentence. Used under the title, in the list, and in link previews. */
			description: z.string(),
			/** Publication date. Posts are ordered by this, newest first. */
			date: z.coerce.date(),
			/** Optional later edit, shown as "updated" on the post. */
			updated: z.coerce.date().optional(),
			/** Lowercase, hyphenated. Each one gets its own filter page. */
			tags: z.array(z.string()).default([]),
			/** Image at the top of the post and in link previews. */
			cover: image().optional(),
			/** Describes the cover for screen readers. */
			coverAlt: z.string().optional(),
			/**
			 * The cover's own background colour, e.g. "#f2e7d3". Covers are shown
			 * whole in a fixed frame, and this fills the space around them so the
			 * frame reads as part of the image.
			 */
			coverBg: z.string().optional(),
			/**
			 * Where the cover sits inside its frame, as CSS object-position, e.g.
			 * "left bottom". Centred when left out.
			 */
			coverPosition: z.string().optional(),
			/**
			 * Drafts are visible while developing and invisible on the live site,
			 * so a post can sit here for a week before you decide on it.
			 */
			draft: z.boolean().default(false),
		}),
});

export const collections = { thoughts };
