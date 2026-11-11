import { getCollection, type CollectionEntry } from "astro:content";

export type Thought = CollectionEntry<"thoughts">;

/**
 * Every post worth showing, newest first.
 *
 * Drafts are kept while developing and dropped from a production build, so an
 * unfinished post can live in the repo without ever reaching the live site.
 */
export async function getThoughts(): Promise<Thought[]> {
	const posts = await getCollection("thoughts", ({ data }) =>
		import.meta.env.PROD ? !data.draft : true,
	);

	return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/**
 * Tags are written the way they are read: "UX/UI", "Art Direction". The URL
 * needs a plain version of the same thing, so "UX/UI" becomes "ux-ui".
 */
export function tagSlug(tag: string): string {
	return tag
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

/** Every tag in use, with how many posts carry it, most used first. */
export async function getThoughtTags(): Promise<
	{ tag: string; slug: string; count: number }[]
> {
	const posts = await getThoughts();
	const counts = new Map<string, number>();

	for (const post of posts) {
		for (const tag of post.data.tags) {
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}

	return [...counts.entries()]
		.map(([tag, count]) => ({ tag, slug: tagSlug(tag), count }))
		.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** "2026-11-11" -> "11 Nov 2026" */
export function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(date);
}

/** Rough minutes to read, at 200 words a minute. Rounded up, never zero. */
export function readingTime(body: string): number {
	const words = body.trim().split(/\s+/).length;
	return Math.max(1, Math.round(words / 200));
}
