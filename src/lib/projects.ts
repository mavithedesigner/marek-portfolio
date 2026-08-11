import { getImage } from "astro:assets";
import type { CycleImageItem } from "../components/CycleImage";
import type { ImageMetadata } from "astro";
import rawProjects from "../data/projects.json";

const imageModules = import.meta.glob("../assets/archive/*.{png,jpg,jpeg}", {
	eager: true,
}) as Record<string, { default: ImageMetadata }>;

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
	about: string;
	programs: string[];
	thumbnail: string;
	images: string[];
	collaborators?: string;
};

export type Project = RawProject & {
	thumbnailItem: CycleImageItem;
	imageItems: CycleImageItem[];
};

const imageCache = new Map<string, Promise<CycleImageItem>>();

async function toCycleImageItem(filename: string): Promise<CycleImageItem> {
	if (imageCache.has(filename)) {
		return imageCache.get(filename)!;
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
			src: medium.src,
			srcSet: `${small.src} 400w, ${medium.src} 800w, ${large.src} 1200w`,
			sizes:
				"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 40vw, 600px",
			width: medium.attributes.width,
			height: medium.attributes.height,
		};
	})();

	imageCache.set(filename, promise);
	return promise;
}

export async function getProjects(): Promise<Project[]> {
	const projects = rawProjects as RawProject[];

	const result: Project[] = [];

	for (const project of projects) {
		const [thumbnailItem, ...imageItems] = await Promise.all([
			toCycleImageItem(project.thumbnail),
			...project.images.map((filename) => toCycleImageItem(filename)),
		]);

		result.push({
			...project,
			thumbnailItem,
			imageItems: imageItems.length > 0 ? imageItems : [thumbnailItem],
		});
	}

	return result;
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


