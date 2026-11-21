import { motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";

type CounterData = {
	currentIndex: number;
	total: number;
	isVisible: boolean;
};

// Global event system for counter updates
const COUNTER_EVENT = "image-counter-update";

export function updateImageCounter(data: CounterData) {
	window.dispatchEvent(new CustomEvent(COUNTER_EVENT, { detail: data }));
}

export default function ImageCounter() {
	const mouseX = useMotionValue(-100);
	const mouseY = useMotionValue(-100);
	const [counterData, setCounterData] = useState<CounterData>({
		currentIndex: 0,
		total: 0,
		isVisible: false,
	});

	// Follows the pointer exactly, like the crosshair above it.

	// Add offset to position counter below cursor
	const counterY = useTransform(mouseY, (value) => value + 30);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			mouseX.set(e.clientX);
			mouseY.set(e.clientY);
		};

		const handleCounterUpdate = (e: Event) => {
			const customEvent = e as CustomEvent<CounterData>;
			setCounterData(customEvent.detail);
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener(COUNTER_EVENT, handleCounterUpdate);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener(COUNTER_EVENT, handleCounterUpdate);
		};
	}, [mouseX, mouseY]);

	if (!counterData.isVisible || counterData.total <= 1) return null;

	return (
		<motion.div
			className="image-counter"
			initial={{ opacity: 0 }}
			animate={{ opacity: counterData.isVisible ? 1 : 0 }}
			transition={{ duration: 0.2 }}
			style={{
				x: mouseX,
				y: counterY,
			}}
		>
			{counterData.currentIndex + 1}/{counterData.total}
		</motion.div>
	);
}
