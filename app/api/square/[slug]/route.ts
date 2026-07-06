import { NextRequest, NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { ARTIST_SQUARE_TOKEN_QUERY } from '@/lib/queries';
import { ArtistSquareToken, ServiceGroup } from '@/lib/types';
import { SquareCatalogListResponse } from '@/lib/square';

async function fetchSquareServices(accessToken: string): Promise<ServiceGroup[]> {
	// Fetch all catalog items from Square
	const response = await fetch('https://connect.squareup.com/v2/catalog/list?types=ITEM,CATEGORY', {
		headers: {
			'Authorization': `Bearer ${accessToken}`,
			'Square-Version': '2024-01-17',
			'Content-Type': 'application/json',
		},
		next: { revalidate: 3600 }, // Cache for 1 hour
	});

	if (!response.ok) {
		throw new Error(`Square API error: ${response.status}`);
	}

	const data = await response.json() as SquareCatalogListResponse;
	const objects = data.objects ?? [];

	// Separate categories and items
	const categories = objects.filter((o) => o.type === 'CATEGORY');
	const items = objects.filter((o) => o.type === 'ITEM');

	// Build a category map
	const categoryMap: Record<string, string> = {};
	categories.forEach((cat) => {
		categoryMap[cat.id] = cat.category_data?.name ?? 'Other';
	});

	// Group items by category
	const grouped: Record<string, ServiceGroup> = {};

	items.forEach((item) => {
		const itemData = item.item_data;
		if (!itemData) return;

		const categoryId = itemData.category_id ?? 'uncategorized';
		const categoryName = categoryMap[categoryId] ?? 'Other Services';

		if (!grouped[categoryId]) {
			grouped[categoryId] = { name: categoryName, items: [] };
		}

		// Each item can have multiple variations (e.g. different lengths/prices)
		const variations = itemData.variations ?? [];
		variations.forEach((variation) => {
			const variationData = variation.item_variation_data;
			if (!variationData) return;

			const priceMoney = variationData.price_money;
			const priceFormatted = priceMoney
				? `$${(priceMoney.amount / 100).toFixed(2)}`
				: undefined;

			// If only one variation with same name as item, don't duplicate the name
			const variationName = variations.length === 1 && variationData.name === 'Regular'
				? itemData.name
				: `${itemData.name}${variationData.name !== 'Regular' ? ` — ${variationData.name}` : ''}`;

			grouped[categoryId].items.push({
				name: variationName,
				price: priceFormatted,
				description: itemData.description ?? undefined,
			});
		});
	});

	return Object.values(grouped);
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> }
) {
	const { slug } = await params;

	// Fetch the access token server-side from Sanity
	const result = await sanityClient.fetch<ArtistSquareToken>(ARTIST_SQUARE_TOKEN_QUERY, { slug }, { next: { tags: ['sanity'] } });

	if (!result?.squareAccessToken) {
		return NextResponse.json({ error: 'No Square token configured' }, { status: 404 });
	}

	try {
		const services = await fetchSquareServices(result.squareAccessToken);
		return NextResponse.json({ services });
	} catch (error) {
		console.error('Square API error:', error);
		return NextResponse.json({ error: 'Failed to fetch Square services' }, { status: 500 });
	}
}
