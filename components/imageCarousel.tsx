'use client';

import Image from "next/image";
import { useRef } from "react";
import type { SanityImageSource } from "@sanity/image-url";
import { urlFor } from "@/lib/image";

type GalleryImage = {
	image: SanityImageSource;
	caption?: string;
};

type Props = {
	gallery: GalleryImage[];
};

export default function ImageCarousel({ gallery }: Props) {
	const scrollRef = useRef<HTMLDivElement>(null);

	if (!gallery || gallery.length === 0) return null;

	return (
		<div className="mt-6">
			<h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-dark)" }}>Gallery</h2>
			<div
				ref={scrollRef}
				className="flex gap-3 overflow-x-auto pb-3"
				style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
			>
				{gallery.map((item, i) => (
					<div
						key={i}
						className="shrink-0 overflow-hidden"
						style={{
							scrollSnapAlign: "start",
							width: "200px",
							borderRadius: "0.75rem",
							border: "1px solid var(--color-dark-10)",
							background: "var(--color-tertiary)",
						}}
					>
						<div style={{ position: "relative", width: "200px", aspectRatio: "2/3" }}>
							<Image src={urlFor(item.image).width(400).height(600).fit("crop").url()} alt={item.caption ?? `Gallery image ${i + 1}`} fill sizes="200px" className="object-cover" />
						</div>
						{item.caption && (
							<p className="text-xs px-2 py-2 m-0 text-center" style={{ color: "var(--color-dark-66)" }}>
								{item.caption}
							</p>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
