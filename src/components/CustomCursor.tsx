import { useEffect, useRef } from "react";

/**
 * A screenshot-style crosshair with the pointer's position on the page next to
 * it, the way the macOS selection tool shows it.
 *
 * It sits exactly under the mouse, no easing: the numbers are only honest if
 * the crosshair is where they say it is. Position is written straight to the
 * DOM on each frame, so moving the mouse never re-renders React.
 *
 * The numbers are page coordinates, so Y keeps counting as you scroll, and
 * they update while scrolling even if the mouse stays still.
 */

// Keep in sync with the image counter, which takes the spot under the cursor.
const COUNTER_EVENT = "image-counter-update";

// Room the label needs before it flips to the other side of the crosshair.
const LABEL_W = 64;
const LABEL_H = 36;
const GAP = 16;

export default function CustomCursor() {
	const root = useRef<HTMLDivElement>(null);
	const label = useRef<HTMLDivElement>(null);
	const xText = useRef<HTMLSpanElement>(null);
	const yText = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const el = root.current;
		const tag = label.current;
		if (!el || !tag) return;

		let clientX = -100;
		let clientY = -100;
		let frame = 0;
		let lastX = "";
		let lastY = "";

		const draw = () => {
			frame = 0;
			el.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;

			// Flip the label left / up near the right and bottom edges.
			const flipX = clientX + GAP + LABEL_W > window.innerWidth;
			const flipY = clientY + GAP + LABEL_H > window.innerHeight;
			tag.style.transform = `translate(${flipX ? `calc(-100% - ${GAP}px)` : `${GAP}px`}, ${
				flipY ? `calc(-100% - ${GAP}px)` : `${GAP}px`
			})`;
			tag.style.textAlign = flipX ? "right" : "left";

			const x = String(Math.round(clientX + window.scrollX));
			const y = String(Math.round(clientY + window.scrollY));
			if (x !== lastX && xText.current) xText.current.textContent = x;
			if (y !== lastY && yText.current) yText.current.textContent = y;
			lastX = x;
			lastY = y;
		};

		const schedule = () => {
			if (!frame) frame = requestAnimationFrame(draw);
		};

		const onMove = (e: PointerEvent) => {
			if (e.pointerType === "touch") return;
			clientX = e.clientX;
			clientY = e.clientY;
			el.dataset.visible = "true";
			schedule();
		};

		const onLeave = () => {
			el.dataset.visible = "false";
		};

		// The gallery shows "2/8" under the cursor; the numbers step aside for it.
		const onCounter = (e: Event) => {
			const { isVisible, total } = (
				e as CustomEvent<{ isVisible: boolean; total: number }>
			).detail;
			tag.dataset.hidden = String(isVisible && total > 1);
		};

		window.addEventListener("pointermove", onMove, { passive: true });
		window.addEventListener("scroll", schedule, { passive: true });
		window.addEventListener("resize", schedule);
		document.documentElement.addEventListener("pointerleave", onLeave);
		window.addEventListener(COUNTER_EVENT, onCounter);

		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("scroll", schedule);
			window.removeEventListener("resize", schedule);
			document.documentElement.removeEventListener("pointerleave", onLeave);
			window.removeEventListener(COUNTER_EVENT, onCounter);
		};
	}, []);

	return (
		<div
			ref={root}
			className="custom-cursor"
			data-visible="false"
			aria-hidden="true"
		>
			<svg
				className="custom-cursor__cross"
				width="34"
				height="34"
				viewBox="0 0 34 34"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<circle cx="17" cy="17" r="6.5" className="custom-cursor__ring" />
				<path
					d="M17 1V14M17 20V33M1 17H14M20 17H33"
					className="custom-cursor__lines"
				/>
				<rect
					x="16"
					y="16"
					width="2"
					height="2"
					className="custom-cursor__dot"
				/>
			</svg>
			<div ref={label} className="custom-cursor__label">
				<span ref={xText}>0</span>
				<span ref={yText}>0</span>
			</div>
		</div>
	);
}
