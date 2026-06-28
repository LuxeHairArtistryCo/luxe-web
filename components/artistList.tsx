'use client';

import { useState } from "react";
import { Artist } from "@/lib/types";
import ArtistCard from "@/components/artistCard";

type Props = {
	artists: Artist[];
	title: string;
};

export default function ArtistList({ artists, title }: Props) {
	const [filterAccepting, setFilterAccepting] = useState(false);

	const filtered = filterAccepting
		? artists.filter(a => a.isAcceptingNewClients)
		: artists;

	return (
		<main className="min-h-screen">
			<div className="max-w-5xl mx-auto px-4 py-8">

				{/* Page heading */}
				<h1 className="text-3xl font-bold mb-4" style={{ color: "var(--color-dark)" }}>
					Meet Our {title}
				</h1>

				{/* Filter button */}
				<button
					onClick={() => setFilterAccepting(prev => !prev)}
					className="mb-6 px-4 py-2 text-sm font-medium rounded text-white transition hover:opacity-90"
					style={{ background: filterAccepting ? "var(--color-dark)" : "var(--color-primary)" }}
				>
					{filterAccepting ? "Show All Artists" : "Filter by Artists Accepting New Clients"}
				</button>

				{/* Artist cards */}
				<div>
					{filtered.length === 0 && (
						<p className="text-sm" style={{ color: "var(--color-dark-66)" }}>
							No artists currently accepting new clients.
						</p>
					)}
					<div className="flex flex-col gap-3 md:gap-6">
						{filtered.map((artist, index) => (
							<ArtistCard key={artist._id} artist={artist} index={index} />
						))}
					</div>
				</div>

			</div>
		</main>
	);
}