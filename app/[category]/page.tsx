import { notFound } from "next/navigation";
import { sanityClient } from "@/lib/sanity";
import { Artist } from "@/lib/types";
import { HAIRSTYLIST_QUERY, AESTHETICIAN_QUERY } from "@/lib/queries";
import ArtistList from "@/components/artistList";

const VALID_CATEGORIES = ['hairstylists', 'aestheticians'];

const CATEGORY_LABELS: Record<string, string> = {
	hairstylists: 'Hairstylists',
	aestheticians: 'Aestheticians',
};

const CATEGORY_QUERIES: Record<string, string> = {
	hairstylists: HAIRSTYLIST_QUERY,
	aestheticians: AESTHETICIAN_QUERY,
};

type Props = {
	params: Promise<{ category: string }>;
};

async function getArtists(category: string): Promise<Artist[]> {
	return await sanityClient.fetch(CATEGORY_QUERIES[category], {}, { next: { tags: ['sanity'] } });
}

export default async function CategoryPage({ params }: Props) {
	const resolvedParams = await params;
	const category = resolvedParams.category;

	if (!VALID_CATEGORIES.includes(category)) notFound();

	const artists = await getArtists(category);

	return <ArtistList artists={artists} title={CATEGORY_LABELS[category]} />;
}