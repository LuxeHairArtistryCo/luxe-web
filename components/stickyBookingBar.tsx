'use client';

import { useEffect, useRef, useState } from "react";
import { Artist } from "@/lib/types";

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
			className="fixed bottom-0 left-0 right-0 md:hidden flex gap-2 justify-center px-4 pt-3"
			style={{
				background: "var(--color-light)",
				borderTop: "1px solid var(--color-dark-10)",
				paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
			}}
		>
			{artist.onlineBookingLink && (
				<a href={artist.onlineBookingLink} target="_blank" rel="noopener noreferrer" className="text-white text-sm px-4 py-2 rounded-full hover:opacity-90 transition" style={{ background: "var(--color-primary)" }}>
					Book Online
				</a>
			)}
			{artist.textBookingPhoneNumber && (
				<a href={`sms:${artist.textBookingPhoneNumber}`} className="text-white text-sm px-4 py-2 rounded-full hover:opacity-90 transition" style={{ background: "var(--color-secondary)", color: "var(--color-dark)" }}>
					Text to Book
				</a>
			)}
			{artist.callBookingPhoneNumber && (
				<a href={`tel:${artist.callBookingPhoneNumber}`} className="text-white text-sm px-4 py-2 rounded-full hover:opacity-90 transition" style={{ background: "var(--color-secondary)", color: "var(--color-dark)" }}>
					Call to Book
				</a>
			)}
		</div>
	);
}