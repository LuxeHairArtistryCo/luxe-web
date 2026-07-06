'use client';

import Image from "next/image";
import { useEffect, useState } from "react";
import type { SanityImageSource } from "@sanity/image-url";
import { urlFor } from "@/lib/image";

type Props = {
	images: SanityImageSource[];
	tagline?: string;
	subtext?: string;
	ctaText?: string;
	ctaLink?: string;
};

const CROSSFADE_INTERVAL_MS = 6000;

export default function HeroSlideshow({ images, tagline, subtext, ctaText, ctaLink }: Props) {
	const [activeIndex, setActiveIndex] = useState(0);

	useEffect(() => {
		// Nothing to cycle through with 0 or 1 image.
		if (images.length <= 1) return;

		const id = setInterval(() => {
			setActiveIndex((prev) => (prev + 1) % images.length);
		}, CROSSFADE_INTERVAL_MS);

		return () => clearInterval(id);
	}, [images.length]);

	return (
		<div className="relative w-full overflow-hidden" style={{ height: "70vh", minHeight: "420px", background: "var(--color-dark)" }}>

			{/* Stacked, crossfading images */}
			{images.map((image, i) => (
				<div
					key={i}
					className="absolute inset-0 transition-opacity"
					style={{ opacity: i === activeIndex ? 1 : 0, transitionDuration: "1200ms" }}
					aria-hidden={i !== activeIndex}
				>
					<Image
						src={urlFor(image).width(1920).height(1080).fit("crop").url()}
						alt=""
						fill
						sizes="100vw"
						priority={i === 0}
						className="object-cover"
					/>
				</div>
			))}

			{/* Scrim for text legibility over any photo */}
			<div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.35) 100%)" }} />

			{/* Overlaid content */}
			<div className="relative h-full flex flex-col items-center justify-center text-center px-4 gap-4">
				{tagline && (
					<h1 className="text-white font-bold text-3xl md:text-5xl max-w-3xl" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
						{tagline}
					</h1>
				)}
				{subtext && (
					<p className="text-white text-base md:text-lg max-w-xl" style={{ opacity: 0.95, textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>
						{subtext}
					</p>
				)}
				{ctaLink && (
					<a
						href={ctaLink}
						target="_blank"
						rel="noopener noreferrer"
						className="mt-2 text-sm md:text-base px-6 py-3 rounded-full font-semibold hover:opacity-90 transition"
						style={{ background: "var(--color-light)", color: "var(--color-primary)" }}
					>
						{ctaText ?? "Book Now"}
					</a>
				)}
			</div>

			{/* Dot indicators */}
			{images.length > 1 && (
				<div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
					{images.map((_, i) => (
						<span
							key={i}
							className="rounded-full transition-all"
							style={{
								width: i === activeIndex ? "20px" : "6px",
								height: "6px",
								background: i === activeIndex ? "var(--color-light)" : "rgba(255,255,255,0.5)",
							}}
						/>
					))}
				</div>
			)}
		</div>
	);
}
