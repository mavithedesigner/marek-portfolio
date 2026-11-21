import { type CollectionEntry, getCollection } from "astro:content";

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

	// Same day: alphabetical by file name, so the order never shuffles between builds.
	return posts.sort(
		(a, b) =>
			b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id),
	);
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

/** Inline style for a cover frame: its background colour and image position. */
export function coverStyle(data: { coverBg?: string; coverPosition?: string }) {
	const parts = [
		data.coverBg && `--cover-bg: ${data.coverBg}`,
		data.coverPosition && `--cover-pos: ${data.coverPosition}`,
	].filter(Boolean);
	return parts.length ? parts.join("; ") : undefined;
}

/*
 * Structured data (schema.org JSON-LD) shared by the layout and the posts.
 *
 * The person is described once, with a stable @id, and everything else refers
 * to that id. Search engines then connect the posts, the blog and the home page
 * to the same author instead of three unrelated "Marek"s.
 */
const SITE = "https://www.vican.design";

export const PERSON_ID = `${SITE}/#person`;
export const BLOG_ID = `${SITE}/thoughts/#blog`;

export const person = {
	"@type": "Person",
	"@id": PERSON_ID,
	name: "Marek Vicáň",
	url: `${SITE}/about/`,
	jobTitle: "Designer",
	address: {
		"@type": "PostalAddress",
		addressLocality: "Bratislava",
		addressCountry: "SK",
	},
	sameAs: [
		"https://www.linkedin.com/in/vicandesign/",
		"https://www.instagram.com/vican.design.aac/",
	],
};

/** Short reference to the author, for use inside other objects. */
export const author = {
	"@type": "Person",
	"@id": PERSON_ID,
	name: person.name,
};

/**
 * JSON for a <script type="application/ld+json">. "<" is escaped so a title
 * containing "</script>" can never close the tag early.
 */
export function toJsonLd(data: unknown): string {
	return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Where a post's 1200×630 link-preview image is built (see thoughts/og/). */
export function ogImagePath(post: Thought): string | undefined {
	return post.data.cover ? `/thoughts/og/${post.id}.jpg` : undefined;
}
