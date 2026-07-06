'use client';

import { useEffect, useRef, useState } from "react";
import { Artist } from "@/lib/types";
import { formatPhoneNumber } from "@/lib/format";

type Props = {
	artist: Artist;
	hasBooking: boolean;
};

export default function StickyBookingBar({ artist, hasBooking }: Props) {
	const [visible, setVisible] = useState(true);
	const footerRef = useRef<Element | null>(null);

	useEffect(() => {
		footerRef.current = document.querySelector('footer');

		const observer = new IntersectionObserver(
			([entry]) => setVisible(!entry.isIntersecting),
			{ threshold: 0 }
		);

		if (footerRef.current) observer.observe(footerRef.current);
		return () => observer.disconnect();
	}, []);

	if (!visible || !hasBooking) return null;

	return (
		<div
			className="fixed bottom-0 left-0 right-0 md:hidden flex items-center gap-2 justify-center px-4 pt-3"
			style={{
				background: "var(--color-light)",
				borderTop: "1px solid var(--color-dark-10)",
				paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
			}}
		>
			{/* All three buttons share the same minHeight so the two-line Text/Call
			    buttons and the one-line Book Online button end up the same size
			    instead of each just hugging its own content. */}
			{artist.onlineBookingLink && (
				<a href={artist.onlineBookingLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center text-white text-sm px-4 py-2 rounded-full hover:opacity-90 transition" style={{ background: "var(--color-primary)", minHeight: "52px" }}>
					Book Online
				</a>
			)}
			{artist.textBookingPhoneNumber && (
				<a href={`sms:${artist.textBookingPhoneNumber}`} className="flex flex-col items-center justify-center leading-tight text-sm px-4 py-2 rounded-full hover:opacity-90 transition" style={{ background: "var(--color-secondary)", color: "var(--color-dark)", minHeight: "52px" }}>
					Text to Book
					<span className="text-xs" style={{ opacity: 0.75 }}>{formatPhoneNumber(artist.textBookingPhoneNumber)}</span>
				</a>
			)}
			{artist.callBookingPhoneNumber && (
				<a href={`tel:${artist.callBookingPhoneNumber}`} className="flex flex-col items-center justify-center leading-tight text-sm px-4 py-2 rounded-full hover:opacity-90 transition" style={{ background: "var(--color-secondary)", color: "var(--color-dark)", minHeight: "52px" }}>
					Call to Book
					<span className="text-xs" style={{ opacity: 0.75 }}>{formatPhoneNumber(artist.callBookingPhoneNumber)}</span>
				</a>
			)}
		</div>
	);
}
