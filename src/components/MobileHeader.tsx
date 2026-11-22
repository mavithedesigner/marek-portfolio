import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import logo from "../assets/logo.svg";
import { SHOW_THOUGHTS } from "../lib/features";

export default function MobileHeader() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	/*
	 * Lock the page while the menu is open. Without this a swipe on the
	 * overlay scrolled the page underneath it: Lenis keeps driving the scroll
	 * on its own, so it has to be stopped as well as the document. The cleanup
	 * also runs on unmount, so a view-transition navigation never leaves the
	 * next page stuck.
	 */
	useEffect(() => {
		if (!isMenuOpen) return;
		const html = document.documentElement;
		const lenis = (window as { __lenis?: { stop(): void; start(): void } })
			.__lenis;
		const prevOverflow = html.style.overflow;
		const prevOverscroll = html.style.overscrollBehavior;

		lenis?.stop();
		html.style.overflow = "hidden";
		html.style.overscrollBehavior = "contain";

		return () => {
			html.style.overflow = prevOverflow;
			html.style.overscrollBehavior = prevOverscroll;
			lenis?.start();
		};
	}, [isMenuOpen]);

	const menuVariants = {
		initial: {
			opacity: 0,
		},
		animate: {
			opacity: 1,
			transition: {
				duration: 0.2,
				when: "beforeChildren",
				staggerChildren: 0.1,
			},
		},
		exit: {
			opacity: 0,
			transition: {
				duration: 0.2,
			},
		},
	};

	const linkVariants = {
		initial: {
			opacity: 0,
			y: 5,
		},
		animate: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.3,
				ease: [0.22, 1, 0.36, 1], // Custom ease for smooth fade
			},
		},
	};

	// Contact is rendered separately as a CTA chip, matching the desktop header.
	const menuLinks = [
		{ href: "/archive/", text: "Archive" },
		...(SHOW_THOUGHTS ? [{ href: "/thoughts/", text: "Thoughts" }] : []),
		{ href: "/about/", text: "About" },
	];

	return (
		<div className="md:hidden">
			{/*
			  Mobile Header - fixed height to prevent layout shift. Same frosted
			  surface as the desktop header, otherwise the logo and "Menu" vanish
			  over light images and content shows through. While the menu is open
			  the overlay already supplies the surface, so the header goes clear
			  to avoid a darker band across the top.
			*/}
			<header
				className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-16 transition-colors duration-200 ${
					isMenuOpen ? "bg-transparent" : "bg-background/85 backdrop-blur-sm"
				}`}
			>
				{/* Padding with a matching negative margin: a 44px tap area around the
				    32px logo, without moving it. */}
				<a href="/" className="z-50 -m-1.5 p-1.5" aria-label="Home">
					<img src={logo.src} alt="" className="site-logo w-8 h-8" />
				</a>

				<button
					type="button"
					onClick={toggleMenu}
					aria-expanded={isMenuOpen}
					aria-controls="mobile-menu"
					aria-label={isMenuOpen ? "Close menu" : "Open menu"}
					className="z-50 -mx-2 -my-2.5 px-2 py-2.5 text-palette-brightest-white focus:outline-none text-base font-normal"
				>
					{isMenuOpen ? "X" : "Menu"}
				</button>
			</header>

			{/* Mobile Menu Overlay */}
			<AnimatePresence>
				{isMenuOpen && (
					<motion.div
						id="mobile-menu"
						initial="initial"
						animate="animate"
						exit="exit"
						variants={menuVariants}
						className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm"
						onClick={() => setIsMenuOpen(false)} // Close when clicking overlay
					>
						<nav
							className="flex flex-col items-center justify-center space-y-4 text-white"
							onClick={(e) => e.stopPropagation()} // Prevent closing when clicking nav content
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.stopPropagation();
								}
							}}
						>
							{menuLinks.map((link, i) => (
								<motion.a
									key={link.href}
									href={link.href}
									className="px-4 py-2 text-xl font-normal text-palette-brightest-white"
									onClick={() => setIsMenuOpen(false)}
									variants={linkVariants}
								>
									{link.text}
								</motion.a>
							))}

							<motion.a
								href="/contact/"
								className="rounded-none bg-palette-brightest-white/15 px-4 py-2 text-xl font-normal text-palette-brightest-white transition-colors hover:bg-palette-brightest-white/35"
								onClick={() => setIsMenuOpen(false)}
								variants={linkVariants}
							>
								Contact
							</motion.a>
						</nav>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Fixed height spacer to prevent layout shift */}
			<div className="h-16" />
		</div>
	);
}
