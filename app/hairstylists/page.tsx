import { sanityClient } from "@/lib/sanity";
import { Artist } from "@/lib/types";
import { HAIRSTYLIST_QUERY } from "@/lib/queries";
import ArtistList from "@/components/artistList";

async function getArtists(): Promise<Artist[]> {
	return await sanityClient.fetch(HAIRSTYLIST_QUERY);
}

export default async function HairstylistsPage() {
	const artists = await getArtists();
	return <ArtistList artists={artists} title="Hairstylists" />;
}