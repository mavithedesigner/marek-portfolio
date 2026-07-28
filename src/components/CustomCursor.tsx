import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect } from "react";

export default function CustomCursor() {
	const cursorX = useMotionValue(-100);
	const cursorY = useMotionValue(-100);

	// Smooth spring animation for cursor movement
	const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
	const cursorXSpring = useSpring(cursorX, springConfig);
	const cursorYSpring = useSpring(cursorY, springConfig);

	useEffect(() => {
		const moveCursor = (e: MouseEvent) => {
			cursorX.set(e.clientX);
			cursorY.set(e.clientY);
		};

		window.addEventListener("mousemove", moveCursor);

		return () => {
			window.removeEventListener("mousemove", moveCursor);
		};
	}, [cursorX, cursorY]);

	return (
		<>
			{/* Main cursor - white plus */}
			{/*
				Motion writes its own `transform` here, which overrides the
				translate(-50%, -50%) in the stylesheet. Without the inner
				wrapper the crosshair is drawn from its top-left corner, so it
				sits ~12px below and right of the real pointer — which made
				links look like they had an offset hit area.
			*/}
			<motion.div
				className="custom-cursor"
				style={{
					x: cursorXSpring,
					y: cursorYSpring,
				}}
			>
				<span className="block -translate-x-1/2 -translate-y-1/2">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M12 2V22M2 12H22"
							stroke="white"
							strokeWidth="2"
							strokeLinecap="round"
						/>
					</svg>
				</span>
			</motion.div>
		</>
	);
}
