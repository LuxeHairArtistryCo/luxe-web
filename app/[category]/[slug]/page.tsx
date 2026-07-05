import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaInstagram, FaFacebook } from "react-icons/fa";
import { sanityClient } from "@/lib/sanity";
import { Artist, ServiceGroup } from "@/lib/types";
import { ARTIST_BY_SLUG_QUERY, ARTIST_SQUARE_TOKEN_QUERY } from "@/lib/queries";
import { urlFor } from "@/lib/image";
import StickyBookingBar from "@/components/stickyBookingBar";
import ImageCarousel from "@/components/imageCarousel";

const VALID_CATEGORIES = ['hairstylists', 'aestheticians'];

const CATEGORY_LABELS: Record<string, string> = {
	hairstylists: 'Hairstylists',
	aestheticians: 'Aestheticians',
};

type Props = {
	params: Promise<{ category: string; slug: string }>;
};

async function getArtist(slug: string): Promise<Artist | null> {
	return await sanityClient.fetch(ARTIST_BY_SLUG_QUERY, { slug }, { next: { tags: ['sanity'] } });
}

async function getSquareServices(slug: string, teamMemberId?: string, isJuniorStylist?: boolean): Promise<ServiceGroup[]> {
	const result = await sanityClient.fetch(ARTIST_SQUARE_TOKEN_QUERY, { slug }, { next: { tags: ['sanity'] } });
	if (!result?.squareAccessToken) return [];

	const headers = {
		'Authorization': `Bearer ${result.squareAccessToken}`,
		'Square-Version': '2024-01-17',
		'Content-Type': 'application/json',
	};

	try {
		// Fetch all catalog items
		const itemsResponse = await fetch('https://connect.squareup.com/v2/catalog/list?types=ITEM', {
			headers,
			next: { revalidate: 3600 },
		});

		if (!itemsResponse.ok) {
			console.error('Square items error:', itemsResponse.status, await itemsResponse.text());
			return [];
		}

		const itemsData = await itemsResponse.json();
		const allItems = itemsData.objects ?? [];

		// Filter to appointment services only
		const serviceItems = allItems.filter((o: any) =>
			o.type === 'ITEM' &&
			o.item_data?.product_type === 'APPOINTMENTS_SERVICE'
		);

		// Collect all unique category IDs from service items
		const categoryIds = [...new Set(
			serviceItems.flatMap((item: any) =>
				(item.item_data?.categories ?? []).map((c: any) => c.id)
			)
		)] as string[];

		// Fetch category details in batch to get names and ordinals
		const categoryMap: Record<string, string> = {};
		const categoryOrdinalMap: Record<string, number> = {};

		if (categoryIds.length > 0) {
			const batchResponse = await fetch('https://connect.squareup.com/v2/catalog/batch-retrieve', {
				method: 'POST',
				headers,
				body: JSON.stringify({ object_ids: categoryIds }),
				next: { revalidate: 3600 },
			} as any);

			if (batchResponse.ok) {
				const batchData = await batchResponse.json();
				(batchData.objects ?? []).forEach((cat: any) => {
					categoryMap[cat.id] = cat.category_data?.name ?? 'Other Services';
					categoryOrdinalMap[cat.id] = cat.category_data?.ordinal ?? 999;
				});
			}
		}

		// Group items by category
		const grouped: Record<string, ServiceGroup> = {};

		serviceItems.forEach((item: any) => {
			const itemData = item.item_data;
			if (!itemData) return;

			const categoryId = itemData.categories?.[0]?.id ?? 'uncategorized';
			const categoryName = categoryMap[categoryId] ?? 'Other Services';

			if (!grouped[categoryId]) {
				grouped[categoryId] = { name: categoryName, items: [] };
			}

			const variations = itemData.variations ?? [];

			// Filter variations: by team member ID if set, otherwise by junior stylist toggle, otherwise show all
			let filteredVariations = variations;
			if (teamMemberId) {
				filteredVariations = variations.filter((v: any) =>
					v.item_variation_data?.team_member_ids?.includes(teamMemberId)
				);
			} else if (isJuniorStylist !== undefined) {
				filteredVariations = isJuniorStylist
					? variations.filter((v: any) =>
						v.item_variation_data?.name?.toLowerCase().includes('junior')
					)
					: variations.filter((v: any) =>
						!v.item_variation_data?.name?.toLowerCase().includes('junior')
					);
			}

			if (filteredVariations.length === 0) return;

			filteredVariations.forEach((variation: any) => {
				const variationData = variation.item_variation_data;
				if (!variationData) return;

				const priceMoney = variationData.price_money;
				const priceFormatted = priceMoney
					? priceMoney.amount === 0
						? 'Complimentary'
						: `$${(priceMoney.amount / 100).toFixed(2)}`
					: undefined;

				const variationName = filteredVariations.length === 1
					? itemData.name
					: `${itemData.name} — ${variationData.name}`;

				grouped[categoryId].items.push({
					name: variationName,
					price: priceFormatted,
					description: itemData.description ?? undefined,
				});
			});
		});

		// Sort categories by Square's own ordinal value from category_data
		return Object.keys(grouped)
			.sort((a, b) => (categoryOrdinalMap[a] ?? 999) - (categoryOrdinalMap[b] ?? 999))
			.map(id => grouped[id])
			.filter(group => group.items.length > 0);

	} catch (error) {
		console.error('Square fetch error:', error);
		return [];
	}
}

export default async function ArtistPage({ params }: Props) {
	const { category, slug } = await params;

	if (!VALID_CATEGORIES.includes(category)) notFound();

	const artist = await getArtist(slug);
	if (!artist) notFound();

	// Validate artist belongs to this category
	if (artist.category !== category) notFound();

	const squareServices: ServiceGroup[] = artist.serviceType === 'square'
		? await getSquareServices(slug, artist.squareTeamMemberId, artist.isJuniorStylist)
		: [];

	const hasBooking =
		artist.isAcceptingNewClients !== false &&
		(artist.onlineBookingLink || artist.textBookingPhoneNumber || artist.callBookingPhoneNumber);

	const backLabel = CATEGORY_LABELS[category];

	const servicesToShow: ServiceGroup[] =
		artist.serviceType === 'square' ? squareServices :
			artist.serviceType === 'local' ? (artist.services ?? []) :
				[];

	return (
		<>
			<main className="max-w-5xl mx-auto px-4 py-8 pb-32 md:pb-12">

				<Link href={`/${category}`} className="text-sm font-semibold hover:opacity-75 transition mb-6 inline-block" style={{ color: "var(--color-primary)" }}>
					← Back to {backLabel}
				</Link>

				{/* Hero */}
				<div className="flex flex-col md:flex-row gap-8 mt-4">

					{/* Photo */}
					<div className="shrink-0 overflow-hidden mx-auto md:mx-0" style={{ position: "relative", width: "100%", maxWidth: "280px", aspectRatio: "2/3", borderRadius: "1rem", background: "var(--color-secondary)" }}>
						<Image src={urlFor(artist.image).width(600).height(900).fit("crop").url()} alt={artist.name} fill sizes="(max-width: 768px) 100vw, 280px" priority className="object-cover" />
					</div>

					{/* Info */}
					<div className="flex flex-col gap-4 justify-start flex-1">

						{/* Promo */}
						{artist.promo && (
							<div className="px-4 py-3 text-sm font-semibold text-white text-center" style={{ background: "var(--color-promo)", borderRadius: "0.5rem" }}>
								{artist.promo}
							</div>
						)}

						{/* Name + Role */}
						<div className="px-4 py-3" style={{ background: "var(--color-primary)", borderRadius: "0.5rem" }}>
							<h1 className="m-0 text-white font-bold text-2xl leading-snug">{artist.name}</h1>
							<p className="m-0 text-white text-sm mt-1" style={{ opacity: 0.9 }}>{artist.role}</p>
						</div>

						{/* Not accepting */}
						{!artist.isAcceptingNewClients && (
							<p className="text-sm font-bold text-center px-4 py-2 rounded m-0" style={{ background: "var(--color-secondary)", color: "var(--color-dark)" }}>
								Currently Not Accepting New Clients
							</p>
						)}

						{/* Desktop booking buttons */}
						{hasBooking && (
							<div className="hidden md:flex flex-wrap gap-2">
								{artist.onlineBookingLink && (
									<a href={artist.onlineBookingLink} target="_blank" rel="noopener noreferrer" className="text-white text-sm px-4 py-2 rounded transition hover:opacity-90" style={{ background: "var(--color-primary)" }}>
										Book Online
									</a>
								)}
								{artist.textBookingPhoneNumber && (
									<a href={`sms:${artist.textBookingPhoneNumber}`} className="text-white text-sm px-4 py-2 rounded transition hover:opacity-90" style={{ background: "var(--color-dark)" }}>
										Text to Book
									</a>
								)}
								{artist.callBookingPhoneNumber && (
									<a href={`tel:${artist.callBookingPhoneNumber}`} className="text-white text-sm px-4 py-2 rounded transition hover:opacity-90" style={{ background: "var(--color-dark)" }}>
										Call to Book
									</a>
								)}
							</div>
						)}

						{/* Social links */}
						{(artist.instagramLink || artist.facebookLink) && (
							<div className="flex gap-4 items-center">
								{artist.instagramLink && (
									<a href={artist.instagramLink} target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition" style={{ color: "var(--color-dark)" }} aria-label="Instagram">
										<FaInstagram size={28} />
									</a>
								)}
								{artist.facebookLink && (
									<a href={artist.facebookLink} target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition" style={{ color: "var(--color-dark)" }} aria-label="Facebook">
										<FaFacebook size={28} />
									</a>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Bio */}
				<div className="mt-6 px-4 py-3 text-sm leading-relaxed" style={{ background: "var(--color-tertiary)", border: "1px solid var(--color-dark-10)", borderRadius: "0.5rem", color: "var(--color-dark)", whiteSpace: "pre-line" }}>
					<h2 className="font-bold text-base mb-2" style={{ color: "var(--color-dark)" }}>About</h2>
					{artist.bio}
				</div>

				{/* Services */}
				{(artist.serviceType === 'external' || artist.serviceType === 'local' || artist.serviceType === 'square') && (
					<div className="mt-6">
						<h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-dark)" }}>Services</h2>

						{artist.serviceType === "external" && artist.externalServicesLink && (
							<a href={artist.externalServicesLink} target="_blank" rel="noopener noreferrer" className="text-white text-sm px-4 py-2 rounded transition hover:opacity-90" style={{ background: "var(--color-dark)" }}>
								View Full Service Menu
							</a>
						)}

						{(artist.serviceType === "local" || artist.serviceType === "square") && servicesToShow.length > 0 && (
							<div className="overflow-hidden" style={{ border: "1px solid var(--color-dark-10)", borderRadius: "1rem" }}>
								{servicesToShow.map((group, i) => (
									<div key={i} style={{ borderBottom: i < servicesToShow.length - 1 ? "1px solid var(--color-dark-10)" : "none" }}>
										<div className="px-4 py-2" style={{ background: "var(--color-primary)" }}>
											<p className="m-0 text-white font-bold text-sm">{group.name}</p>
										</div>
										<div style={{ background: "var(--color-tertiary)" }}>
											{group.items.map((item, j) => (
												<div key={j} className="flex justify-between items-start gap-4 px-4 py-2" style={{ borderTop: j > 0 ? "1px solid var(--color-dark-10)" : "none" }}>
													<div>
														<p className="m-0 text-sm font-medium" style={{ color: "var(--color-dark)" }}>{item.name}</p>
														{item.description && (
															<p className="m-0 text-xs mt-0.5" style={{ color: "var(--color-dark-66)" }}>{item.description}</p>
														)}
													</div>
													{item.price && (
														<span className="text-sm font-semibold shrink-0" style={{ color: "var(--color-dark)" }}>{item.price}</span>
													)}
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						)}

						{artist.serviceType === "square" && squareServices.length === 0 && (
							<p className="text-sm" style={{ color: "var(--color-dark-66)" }}>
								No services found. Please check the Square connection.
							</p>
						)}
					</div>
				)}

				{/* Gallery */}
				{artist.gallery && artist.gallery.length > 0 && (
					<ImageCarousel gallery={artist.gallery} />
				)}

			</main>

			<StickyBookingBar artist={artist} hasBooking={!!hasBooking} />
		</>
	);
}