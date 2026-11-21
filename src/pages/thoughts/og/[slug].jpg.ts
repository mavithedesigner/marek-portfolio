import type { APIContext, ImageMetadata } from "astro";
import sharp from "sharp";
import { type Thought, getThoughts } from "../../../lib/thoughts";

/**
 * A 1200×630 link-preview image for every post with a cover.
 *
 * The covers are logos on transparent backgrounds in odd proportions (one is
 * square). Shared as they are, LinkedIn and Slack crop them to 1.91:1 and fill
 * the transparency with whatever colour they like, often black, which hides a
 * dark logo completely. Here the whole cover is fitted into the frame on its
 * own `coverBg`, the same way the post page shows it, and saved as a JPG that
 * every platform accepts.
 */
export async function getStaticPaths() {
	const posts = await getThoughts();

	return posts
		.filter((post) => post.data.cover)
		.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

export async function GET({ props }: APIContext<{ post: Thought }>) {
	const { cover, coverBg = "#000000" } = props.post.data;
	const image = cover as ImageMetadata & { fsPath?: string };

	// The build exposes the source file directly; `bun dev` only has a
	// "/@fs/<path>?…" URL, which points at the same file.
	const source =
		image.fsPath ??
		decodeURIComponent(
			new URL(image.src, "http://dev").pathname.replace(/^\/@fs/, ""),
		);

	const jpg = await sharp(source)
		.flatten({ background: coverBg })
		.resize(1200, 630, { fit: "contain", background: coverBg })
		.jpeg({ quality: 85, mozjpeg: true })
		.toBuffer();

	return new Response(new Uint8Array(jpg), {
		headers: { "Content-Type": "image/jpeg" },
	});
}
