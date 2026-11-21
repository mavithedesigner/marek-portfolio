/**
 * Thoughts (the writing section) is built but not public yet.
 *
 * While this is `false`:
 * - `bun dev` still shows Thoughts, so posts can be written and checked locally;
 * - the live site has no Thoughts links, no /thoughts pages, no RSS feed and no
 *   sitemap entries (see the `hideThoughts` integration in astro.config.mjs).
 *
 * To launch: set this to `true`, set `draft: false` on the posts that are ready,
 * then push.
 */
export const PUBLISH_THOUGHTS = true;

/** Whether Thoughts should appear in the page being rendered right now. */
// `?.` because astro.config.mjs imports this file too, outside of Vite.
export const SHOW_THOUGHTS = PUBLISH_THOUGHTS || Boolean(import.meta.env?.DEV);
