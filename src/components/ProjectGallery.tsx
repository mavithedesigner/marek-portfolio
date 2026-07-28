import { useCallback, useEffect, useRef, useState } from "react";

export type GalleryImage = {
	title: string;
	src: string;
	srcSet?: string;
	sizes?: string;
	width?: number;
	height?: number;
};

type ProjectGalleryProps = {
	images: GalleryImage[];
};

/**
 * Horizontal, scroll-driven showcase used ONLY on project detail pages.
 *
 * Behaviour
 *  - The strip is pinned to the viewport while page scroll drives it sideways
 *    (1px of vertical scroll = 1px of horizontal travel). When the strip runs
 *    out, the pin releases and the page carries on scrolling normally.
 *  - Pointer devices: the strip is moved with a transform, so the wheel is
 *    never captured by a nested scroll container.
 *  - Touch devices: the strip is natively scrollable so it can be swiped, and
 *    the page scroll position is re-synced once the finger lifts.
 *
 * Deliberately separate from <CycleImage />, which stays click-to-advance and
 * is still used on the home, archive and about pages.
 */
export default function ProjectGallery({ images }: ProjectGalleryProps) {
	const rootRef = useRef<HTMLDivElement | null>(null);
	const viewportRef = useRef<HTMLDivElement | null>(null);
	const stripRef = useRef<HTMLDivElement | null>(null);
	const barRef = useRef<HTMLSpanElement | null>(null);

	const overflowRef = useRef(0);
	const trackRef = useRef<HTMLElement | null>(null);
	const stickyRef = useRef<HTMLElement | null>(null);
	/** Resolved `top` of the sticky element — where the pin actually engages. */
	const stickyTopRef = useRef(0);
	const offsetsRef = useRef<number[]>([]);
	const indexRef = useRef(0);
	const touchingRef = useRef(false);
	const freeScrollRef = useRef(false);

	const [index, setIndex] = useState(0);
	const [isFreeScroll, setIsFreeScroll] = useState(false);
	/** Below this width the strip is a plain swipeable carousel — no pinning. */
	const PIN_MIN_WIDTH = 1024;

	const total = images.length;

	/** Measure the strip, cache figure positions and size the pin track. */
	const measure = useCallback(() => {
		const viewport = viewportRef.current;
		const strip = stripRef.current;
		if (!viewport || !strip) return;

		if (!trackRef.current) {
			trackRef.current = rootRef.current?.closest<HTMLElement>("[data-pin-track]") ?? null;
		}
		if (!stickyRef.current) {
			stickyRef.current = rootRef.current?.closest<HTMLElement>("[data-pin-sticky]") ?? null;
		}

		const overflow = Math.max(0, strip.scrollWidth - viewport.clientWidth);
		overflowRef.current = overflow;

		offsetsRef.current = Array.from(strip.children).map((child) => {
			const el = child as HTMLElement;
			return el.offsetLeft + el.offsetWidth / 2;
		});

		const track = trackRef.current;
		const sticky = stickyRef.current;
		if (track && sticky) {
			stickyTopRef.current = Number.parseFloat(getComputedStyle(sticky).top) || 0;
			// The track is exactly as tall as the pinned block plus the distance the
			// strip has to travel. Deriving it from the sticky element's real height
			// (rather than a flat 100svh) means the strip starts moving the instant
			// the pin engages — no dead scroll first.
			// Below the breakpoint there is no pin at all, so the track collapses to
			// its natural height and the project copy sits right under the strip.
			track.style.height =
				!freeScrollRef.current && overflow > 0
					? `${Math.round(sticky.offsetHeight + overflow)}px`
					: "";
		}
	}, []);

	/** Apply a 0–1 position to the strip, progress bar and counter. */
	const applyRatio = useCallback((ratio: number) => {
		const viewport = viewportRef.current;
		const strip = stripRef.current;
		const overflow = overflowRef.current;
		if (!viewport || !strip) return;

		const clamped = Math.min(1, Math.max(0, ratio));
		const x = clamped * overflow;

		if (freeScrollRef.current) {
			// The user drives scrollLeft directly — only read it back.
		} else {
			strip.style.transform = `translate3d(${-x}px, 0, 0)`;
		}

		if (barRef.current) {
			barRef.current.style.width = `${Math.max(3, clamped * 100)}%`;
		}

		// Nearest figure to the centre of the visible area.
		const centre = x + viewport.clientWidth / 2;
		const offsets = offsetsRef.current;
		let closest = 0;
		let smallest = Number.POSITIVE_INFINITY;
		for (let i = 0; i < offsets.length; i++) {
			const distance = Math.abs(offsets[i] - centre);
			if (distance < smallest) {
				smallest = distance;
				closest = i;
			}
		}
		if (closest !== indexRef.current) {
			indexRef.current = closest;
			setIndex(closest);
		}
	}, []);

	// Poll the scroll position each frame. Lenis animates window.scrollY per
	// frame, so a rAF loop stays exactly in step with the smooth scrolling.
	useEffect(() => {
		let frame = 0;
		const loop = () => {
			const track = trackRef.current;
			const overflow = overflowRef.current;
			if (overflow > 0) {
				if (freeScrollRef.current) {
					// Carousel mode: the strip's own scroll position is the source of truth.
					const viewport = viewportRef.current;
					if (viewport) applyRatio(viewport.scrollLeft / overflow);
				} else if (track) {
					// Progress is measured from the moment the block sticks, i.e. when
					// the track's top reaches the sticky offset — not from y = 0.
					applyRatio(
						(stickyTopRef.current - track.getBoundingClientRect().top) / overflow,
					);
				}
			}
			frame = requestAnimationFrame(loop);
		};
		frame = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(frame);
	}, [applyRatio]);

	// Measure once mounted, on resize, and as images finish decoding.
	useEffect(() => {
		const syncMode = () => {
			const free = window.innerWidth < PIN_MIN_WIDTH;
			freeScrollRef.current = free;
			setIsFreeScroll(free);
			// Leaving pin mode must clear the transform, or the strip stays offset.
			if (free && stripRef.current) stripRef.current.style.transform = "";
		};

		syncMode();
		measure();

		const onResize = () => {
			syncMode();
			measure();
		};
		window.addEventListener("resize", onResize);

		const imgs = Array.from(stripRef.current?.querySelectorAll("img") ?? []);
		for (const img of imgs) {
			if (!img.complete) img.addEventListener("load", onResize, { once: true });
		}

		return () => {
			window.removeEventListener("resize", onResize);
			const track = trackRef.current;
			if (track) track.style.height = "";
		};
	}, [measure]);

	const handleTouchStart = useCallback(() => {
		touchingRef.current = true;
	}, []);

	const handleTouchEnd = useCallback(() => {
		touchingRef.current = false;
	}, []);

	if (total === 0) return null;

	return (
		<div ref={rootRef} className="w-full">
			<div
				ref={viewportRef}
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
				onTouchCancel={handleTouchEnd}
				className="no-scrollbar w-full overflow-y-hidden"
				style={{
					// Carousel below the breakpoint: native horizontal scrolling so it can
					// be swiped. Above it the strip is pinned and moved with a transform,
					// so the wheel is never swallowed by this container.
					overflowX: isFreeScroll ? "auto" : "hidden",
					overscrollBehaviorX: "contain",
					touchAction: "pan-x pan-y",
					scrollSnapType: isFreeScroll ? "x proximity" : undefined,
				}}
			>
				<div
					ref={stripRef}
					className="flex w-max items-start gap-6 md:gap-8 will-change-transform"
				>
					{images.map((image, i) => (
						<figure
							key={`${image.src}-${i}`}
							className="shrink-0"
							style={{ scrollSnapAlign: isFreeScroll ? "start" : undefined }}
						>
							{/* svh keeps the caption + counter inside the viewport on mobile */}
							<div className="h-[50svh] min-h-[200px] max-h-[420px] lg:h-[62svh] lg:max-h-[620px]">
								<img
									src={image.src}
									srcSet={image.srcSet}
									sizes={image.sizes}
									alt={image.title}
									width={image.width}
									height={image.height}
									loading={i < 3 ? "eager" : "lazy"}
									decoding="async"
									draggable={false}
									className="h-full w-auto max-w-none select-none object-contain"
								/>
							</div>
							<figcaption className="text-palette-brightest-white text-[0.8rem] mt-2">
								{image.title}
							</figcaption>
						</figure>
					))}
				</div>
			</div>

			{total > 1 && (
				<div className="mt-4 flex items-center gap-4">
					<span className="font-body text-[0.8rem] text-palette-brightest-white/70 tabular-nums">
						{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
					</span>
					<span className="relative h-px flex-1 bg-white/15">
						<span
							ref={barRef}
							className="absolute inset-y-0 left-0 bg-palette-brightest-white/70"
							style={{ width: "3%" }}
						/>
					</span>
				</div>
			)}
		</div>
	);
}
