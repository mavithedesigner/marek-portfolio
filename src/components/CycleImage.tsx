import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { updateImageCounter } from "./ImageCounter";

export type CycleImageItem = {
	title: string;
	src: string;
	srcSet?: string;
	sizes?: string;
	width?: number;
	height?: number;
};

type CycleImageProps = {
	images: CycleImageItem[];
	startIndex?: number;
	className?: string;
	captionClassName?: string;
	wrapperClassName?: string;
	cursorClassName?: string;
	disableClick?: boolean;
	showCounter?: boolean;
};

export default function CycleImage(props: CycleImageProps) {
	const {
		images,
		startIndex = 0,
		className = "w-full h-auto select-none",
		captionClassName = "text-palette-brightest-white text-[0.8rem] mt-1",
		wrapperClassName = "relative overflow-hidden cycle-image-container",
		cursorClassName = "cursor-default hover:cursor-e-resize",
		disableClick = false,
		showCounter = false,
	} = props;

	const total = images.length;
	const initialIndex = useMemo(() => {
		if (total === 0) return 0;
		return Math.min(Math.max(startIndex, 0), total - 1);
	}, [startIndex, total]);

	const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
	const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
	const [isHovering, setIsHovering] = useState<boolean>(false);

	// Update counter when state changes
	useEffect(() => {
		if (showCounter) {
			updateImageCounter({
				currentIndex,
				total,
				isVisible: isHovering,
			});
		}
	}, [currentIndex, total, isHovering, showCounter]);

	const current = images[total > 0 ? currentIndex % total : 0] ?? {
		title: "",
		src: "",
	};

	// Smooth transition handling
	useEffect(() => {
		if (isTransitioning) {
			const timer = setTimeout(() => {
				setIsTransitioning(false);
			}, 200); // Match CSS transition duration
			return () => clearTimeout(timer);
		}
	}, [isTransitioning]);

	const handleNext = useCallback(
		(e: React.MouseEvent | React.KeyboardEvent) => {
			// Prevent default behavior but don't interfere with Lenis smooth scroll
			e.preventDefault();
			e.stopPropagation();

			// Prevent any potential scrolling from the click
			if (e.type === "click") {
				(e.target as HTMLElement).blur();
			}

			if (total === 0 || isTransitioning) return;

			setIsTransitioning(true);
			setCurrentIndex((prev) => (prev + 1) % total);
		},
		[total, isTransitioning],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLImageElement>) => {
			if (e.key === "Enter" || e.key === " ") {
				handleNext(e);
			}
		},
		[handleNext],
	);

	return (
		<div className={wrapperClassName}>
			<div
				className="relative w-full h-full max-h-[47rem]"
				style={{
					aspectRatio:
						current.width && current.height
							? `${current.width}/${current.height}`
							: "1",
					minHeight: "200px", // Prevent container from being too small
				}}
				onMouseEnter={() => setIsHovering(true)}
				onMouseLeave={() => setIsHovering(false)}
			>
				<img
					src={current.src}
					srcSet={current.srcSet}
					sizes={current.sizes}
					alt={current.title}
					loading="lazy"
					decoding="async"
					width={current.width}
					height={current.height}
					className={`${className} ${cursorClassName} inset-0 ${isTransitioning ? "opacity-80" : "opacity-100"}`}
					onClick={disableClick ? undefined : handleNext}
					onKeyDown={disableClick ? undefined : handleKeyDown}
					// tabIndex={0}
					draggable={false}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "contain",
						objectPosition: "left",
						transition: "opacity 0.2s ease-in-out",
					}}
				/>
			</div>
			{total > 1 && showCounter && (
				<div className="flex items-center justify-start gap-1.5 mt-2 md:hidden">
					{images.map((_, i) => (
						<button
							key={i}
							type="button"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								if (!isTransitioning) {
									setIsTransitioning(true);
									setCurrentIndex(i);
								}
							}}
							className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
								i === currentIndex ? "bg-white" : "bg-white/30"
							}`}
							aria-label={`Image ${i + 1} of ${total}`}
						/>
					))}
				</div>
			)}
			<div>
				<p className={captionClassName}>{current.title}</p>
			</div>
		</div>
	);
}
