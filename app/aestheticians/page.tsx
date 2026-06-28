import { sanityClient } from "@/lib/sanity";
import { Artist } from "@/lib/types";
import { AESTHETICIAN_QUERY } from "@/lib/queries";
import ArtistCard from "@/components/artistCard";

async function getArtists(): Promise<Artist[]> {
	return await sanityClient.fetch(AESTHETICIAN_QUERY);
}

export default async function HairstylistsPage() {
	const artists = await getArtists();

	return (
		<main className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-8">
			<h1 className="text-3xl font-bold text-dark">Aestheticians</h1>
			{artists.map((artist, index) => (
				<ArtistCard key={artist._id} artist={artist} index={index} />
			))}
		</main>
	);
}