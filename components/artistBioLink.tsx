'use client';

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Props = {
	bio: string;
	href: string | null;
};

// Renders the artist's bio clamped to `--bio-clamp` lines (see globals.css).
// On mobile the clamp regularly cuts the bio off mid-sentence, so once we
// detect that's actually happened (scrollHeight > clientHeight — the clamp
// only trims visually, it doesn't tell us) we turn the bio into a link to
// the artist's full profile so a tap continues reading instead of dead-ending.
export default function ArtistBioLink({ bio, href }: Props) {
	const textRef = useRef<HTMLDivElement>(null);
	const [isTruncated, setIsTruncated] = useState(false);

	useEffect(() => {
		const el = textRef.current;
		if (!el) return;

		const checkTruncation = () => setIsTruncated(el.scrollHeight > el.clientHeight + 1);

		checkTruncation();

		// --bio-clamp changes across the breakpoints defined in globals.css, so
		// a bio that's truncated at one viewport width may not be at another —
		// re-check on resize rather than only once on mount.
		window.addEventListener("resize", checkTruncation);
		return () => window.removeEventListener("resize", checkTruncation);
	}, [bio]);

	const clampedText = (
		<div
			ref={textRef}
			style={{
				display: "-webkit-box",
				WebkitBoxOrient: "vertical" as const,
				WebkitLineClamp: "var(--bio-clamp)",
				overflow: "hidden",
			}}
		>
			{bio}
		</div>
	);

	if (!href || !isTruncated) {
		return clampedText;
	}

	return (
		<Link
			href={`${href}#bio-mobile`}
			className="relative block"
			aria-label="Bio cut off — tap to keep reading on the full profile"
		>
			{clampedText}
			{/* Sits on the last visible line only (bottom/right of the clamped
			    text box). Inherits the bio's own text-sm/leading-relaxed from
			    the ancestor in artistCard.tsx instead of setting its own font
			    size, so it lines up with the surrounding text instead of
			    looking like a mismatched sticker. The gradient fade is a fixed
			    16px, not a percentage of this span's own (small) width, so the
			    background goes fully opaque well before "Read more" starts —
			    otherwise the fade only covered part of the label and the
			    clamped text showed through behind it. */}
			<span
				className="absolute bottom-0 right-0 pl-6 font-semibold whitespace-nowrap"
				style={{
					background: "linear-gradient(to right, transparent, var(--color-tertiary) 16px)",
					color: "var(--color-primary)",
				}}
			>
				Read more
			</span>
		</Link>
	);
}
