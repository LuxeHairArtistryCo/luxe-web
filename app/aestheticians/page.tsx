import { sanityClient } from "@/lib/sanity";
import { Artist } from "@/lib/types";
import { AESTHETICIAN_QUERY } from "@/lib/queries";
import ArtistList from "@/components/artistList";

async function getArtists(): Promise<Artist[]> {
	return await sanityClient.fetch(AESTHETICIAN_QUERY);
}

export default async function AestheticiansPage() {
	const artists = await getArtists();
	return <ArtistList artists={artists} title="Aestheticians" />;
}