import { getImage } from "astro:assets";
import type { CycleImageItem } from "../components/CycleImage";
import type { ImageMetadata } from "astro";
import rawProjects from "../data/projects.json";

const imageModules = import.meta.glob("../assets/archive/*.{png,jpg,jpeg}", {
	eager: true,
}) as Record<string, { default: ImageMetadata }>;

/**
 * An image is either a bare filename or an object carrying a real alt text.
 * The filename stays visible as the caption (that archival look is deliberate),
 * but screen readers and image search get a human sentence instead.
 */
export type RawImage = string | { src: string; alt?: string };

type RawProject = {
	slug: string;
	name: string;
	/** One-line summary shown under the thumbnail on home and archive. */
	tagline: string;
	website?: string;
	/** Optional override for the link text shown next to "Website". */
	websiteLabel?: string;
	client: string;
	year: string;
	role: string;
	/** Disciplines, used for archive filtering and the hover chips. */
	tags?: string[];
	/** What the work actually achieved. Shown above About on the detail page. */
	outcome?: string;
	about: string;
	programs: string[];
	thumbnail: string;
	images: RawImage[];
	collaborators?: string;
};

export type Project = Omit<RawProject, "images"> & {
	images: string[];
	tags: string[];
	thumbnailItem: CycleImageItem;
	imageItems: CycleImageItem[];
};

const imageCache = new Map<string, Promise<CycleImageItem>>();

/** "aacarabiner_hand.png" -> "aacarabiner hand" */
function humanizeFilename(filename: string): string {
	return filename
		.replace(/\.[^.]+$/, "")
		.replace(/[_-]+/g, " ")
		.trim();
}

function toRawImage(entry: RawImage): { src: string; alt?: string } {
	return typeof entry === "string" ? { src: entry } : entry;
}

async function toCycleImageItem(
	filename: string,
	alt?: string,
): Promise<CycleImageItem> {
	const cacheKey = `${filename}::${alt ?? ""}`;
	if (imageCache.has(cacheKey)) {
		return imageCache.get(cacheKey)!;
	}

	const promise = (async () => {
		const entry = Object.entries(imageModules).find(([path]) => {
			// Extract filename from path and compare
			const normalizedPath = path.replace(/\\/g, '/');
			const pathFilename = normalizedPath.split('/').pop();
			return pathFilename === filename || normalizedPath.endsWith(`/archive/${filename}`);
		});

		if (!entry) {
			throw new Error(
				`Image "${filename}" not found in ../assets/archive/. Make sure the file exists.`,
			);
		}

		const image = entry[1].default;

		const [small, medium, large] = await Promise.all([
			getImage({ src: image, width: 400, format: "webp", quality: 85 }),
			getImage({ src: image, width: 800, format: "webp", quality: 85 }),
			getImage({ src: image, width: 1200, format: "webp", quality: 85 }),
		]);

		return {
			title: filename,
			alt: alt ?? humanizeFilename(filename),
			src: medium.src,
			srcSet: `${small.src} 400w, ${medium.src} 800w, ${large.src} 1200w`,
			sizes:
				"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 40vw, 600px",
			width: medium.attributes.width,
			height: medium.attributes.height,
		};
	})();

	imageCache.set(cacheKey, promise);
	return promise;
}

export async function getProjects(): Promise<Project[]> {
	const projects = rawProjects as RawProject[];

	const result: Project[] = [];

	for (const project of projects) {
		const images = project.images.map(toRawImage);

		const [thumbnailItem, ...imageItems] = await Promise.all([
			toCycleImageItem(
				project.thumbnail,
				// Reuse the written alt when the thumbnail is also in the gallery.
				images.find((image) => image.src === project.thumbnail)?.alt ??
					`${project.name}, ${humanizeFilename(project.thumbnail)}`,
			),
			...images.map((image) =>
				toCycleImageItem(
					image.src,
					image.alt ?? `${project.name}, ${humanizeFilename(image.src)}`,
				),
			),
		]);

		result.push({
			...project,
			images: images.map((image) => image.src),
			tags: project.tags ?? [],
			thumbnailItem,
			imageItems: imageItems.length > 0 ? imageItems : [thumbnailItem],
		});
	}

	return result;
}

/**
 * A 1200×630 JPEG for link previews. Social platforms want that exact ratio and
 * are unreliable with WebP, so this is generated separately from the gallery.
 */
export async function getOgImage(filename: string): Promise<string> {
	const entry = Object.entries(imageModules).find(
		([path]) => path.replace(/\\/g, "/").split("/").pop() === filename,
	);

	if (!entry) {
		throw new Error(`Image "${filename}" not found in ../assets/archive/.`);
	}

	const image = await getImage({
		src: entry[1].default,
		width: 1200,
		height: 630,
		fit: "cover",
		format: "jpg",
		quality: 80,
	});

	return image.src;
}

/** Every tag in use, in the order projects declare them. */
export async function getProjectTags(): Promise<string[]> {
	const projects = await getProjects();
	const seen = new Set<string>();

	for (const project of projects) {
		for (const tag of project.tags) {
			seen.add(tag);
		}
	}

	return [...seen];
}

export async function getProjectBySlug(
	slug: string,
): Promise<{ project: Project; index: number; previous?: Project; next?: Project } | null> {
	const projects = await getProjects();
	const index = projects.findIndex((p) => p.slug === slug);

	if (index === -1) return null;

	return {
		project: projects[index],
		index,
		previous: index > 0 ? projects[index - 1] : undefined,
		next: index < projects.length - 1 ? projects[index + 1] : undefined,
	};
}
