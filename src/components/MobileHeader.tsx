import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import logo from "../assets/logo.svg";

export default function MobileHeader() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

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
		{ href: "/archive", text: "Archive" },
		{ href: "/about", text: "About" },
	];

	return (
		<div className="md:hidden">
			{/* Mobile Header - fixed height to prevent layout shift */}
			<header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-16 bg-transparent">
				<a href="/" className="z-50">
					<img src={logo.src} alt="Logo" className="site-logo w-8 h-8" />
				</a>

				<button
					type="button"
					onClick={toggleMenu}
					className="z-50 text-white focus:outline-none text-base font-normal"
				>
					{isMenuOpen ? "X" : "Menu"}
				</button>
			</header>

			{/* Mobile Menu Overlay */}
			<AnimatePresence>
				{isMenuOpen && (
					<motion.div
						initial="initial"
						animate="animate"
						exit="exit"
						variants={menuVariants}
						className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm"
						onClick={() => setIsMenuOpen(false)} // Close when clicking overlay
					>
						<nav
							className="flex flex-col items-center justify-center space-y-8 text-white"
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
									className="text-xl font-normal text-secondary-foreground first-letter:text-palette-brightest-white hover:opacity-60 transition-opacity"
									onClick={() => setIsMenuOpen(false)}
									variants={linkVariants}
								>
									{link.text}
								</motion.a>
							))}

							<motion.a
								href="/contact"
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
