import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaInstagram, FaFacebook } from "react-icons/fa";
import { sanityClient } from "@/lib/sanity";
import { Artist, ArtistSquareToken, ServiceGroup } from "@/lib/types";
import { ARTIST_BY_SLUG_QUERY, ARTIST_SQUARE_TOKEN_QUERY } from "@/lib/queries";
import { urlFor } from "@/lib/image";
import { SquareCatalogListResponse, SquareCatalogObject } from "@/lib/square";
import { formatPhoneNumber } from "@/lib/format";
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
	return await sanityClient.fetch<Artist | null>(ARTIST_BY_SLUG_QUERY, { slug }, { next: { tags: ['sanity'] } });
}

async function getSquareServices(slug: string, teamMemberId?: string, isJuniorStylist?: boolean): Promise<ServiceGroup[]> {
	const result = await sanityClient.fetch<ArtistSquareToken>(ARTIST_SQUARE_TOKEN_QUERY, { slug }, { next: { tags: ['sanity'] } });
	if (!result?.squareAccessToken) return [];

	const headers = {
		'Authorization': `Bearer ${result.squareAccessToken}`,
		'Square-Version': '2024-01-17',
		'Content-Type': 'application/json',
	};

	try {
		// Fetch all catalog items — Square paginates catalog/list (a page tops
		// out well short of a typical salon's full item count once modifiers,
		// discounts, etc. share the same catalog), so we have to follow the
		// `cursor` until it stops coming back or we silently drop everything
		// past the first page.
		const allItems: SquareCatalogObject[] = [];
		let cursor: string | undefined;

		do {
			const url = new URL('https://connect.squareup.com/v2/catalog/list');
			url.searchParams.set('types', 'ITEM');
			if (cursor) url.searchParams.set('cursor', cursor);

			const itemsResponse = await fetch(url.toString(), {
				headers,
				// revalidate is a time-based fallback in case the webhook is ever
				// missed; tags lets the Square webhook drop this immediately when
				// catalog data actually changes, instead of waiting up to an hour.
				// Tagged with both the broad 'square' tag (dropped by the shared
				// account's app/api/revalidate-square/route.ts) and this artist's
				// own square-<slug> tag (dropped by
				// app/api/revalidate-square/[artist]/route.ts, for artists on their
				// own independent Square account) — an artist only needs whichever
				// one actually applies to them, but tagging with both costs nothing
				// and means this code doesn't need to know which kind of account a
				// given artist is on.
				next: { revalidate: 3600, tags: ['square', `square-${slug}`] },
			});

			if (!itemsResponse.ok) {
				console.error('Square items error:', itemsResponse.status, await itemsResponse.text());
				return [];
			}

			const itemsData = await itemsResponse.json() as SquareCatalogListResponse;
			allItems.push(...(itemsData.objects ?? []));
			cursor = itemsData.cursor;
		} while (cursor);

		// Filter to appointment services only
		const serviceItems = allItems.filter((o) =>
			o.type === 'ITEM' &&
			o.item_data?.product_type === 'APPOINTMENTS_SERVICE'
		);

		// Collect all unique category IDs from service items
		const categoryIds = [...new Set(
			serviceItems.flatMap((item) =>
				(item.item_data?.categories ?? []).map((c) => c.id)
			)
		)];

		// Fetch category details in batch to get names and ordinals
		const categoryMap: Record<string, string> = {};
		const categoryOrdinalMap: Record<string, number> = {};

		if (categoryIds.length > 0) {
			const batchResponse = await fetch('https://connect.squareup.com/v2/catalog/batch-retrieve', {
				method: 'POST',
				headers,
				body: JSON.stringify({ object_ids: categoryIds }),
				next: { revalidate: 3600, tags: ['square', `square-${slug}`] },
			});

			if (batchResponse.ok) {
				const batchData = await batchResponse.json() as SquareCatalogListResponse;
				(batchData.objects ?? []).forEach((cat) => {
					categoryMap[cat.id] = cat.category_data?.name ?? 'Other Services';
					// Square nests the sibling-order value inside parent_category
					// (even top-level categories have one, just without an id) —
					// category_data itself has no top-level ordinal field.
					categoryOrdinalMap[cat.id] = cat.category_data?.parent_category?.ordinal ?? 999;
				});
			}
		}

		// Group items by category
		const grouped: Record<string, ServiceGroup> = {};

		serviceItems.forEach((item) => {
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
				// A variation only shows up for this artist if they're explicitly
				// listed in its team_member_ids — an empty/missing list means the
				// variation isn't assigned to anyone via this field, not that it's
				// open to everyone, so it must be excluded here.
				filteredVariations = variations.filter((v) =>
					v.item_variation_data?.team_member_ids?.includes(teamMemberId)
				);
			} else if (isJuniorStylist !== undefined) {
				filteredVariations = isJuniorStylist
					? variations.filter((v) =>
						v.item_variation_data?.name?.toLowerCase().includes('junior')
					)
					: variations.filter((v) =>
						!v.item_variation_data?.name?.toLowerCase().includes('junior')
					);
			}

			if (filteredVariations.length === 0) return;

			// Merge all bookable variations of this item into a single row —
			// clients care about the service (e.g. "Haircut"), not Square's
			// internal length/style variation breakdown, so instead of one line
			// per variation we show one line with a price range spanning all of
			// them (e.g. "$140.00–$700.00"), or a single price if they all match.
			const format = (cents: number) => `$${(cents / 100).toFixed(2)}`;
			const amounts = filteredVariations
				.map((v) => v.item_variation_data?.price_money?.amount)
				.filter((amount): amount is number => amount !== undefined);

			let priceFormatted: string | undefined;
			if (amounts.length > 0) {
				const min = Math.min(...amounts);
				const max = Math.max(...amounts);
				priceFormatted = min === max
					? (min === 0 ? 'Complimentary' : format(min))
					: `${format(min)}–${format(max)}`;
			}

			grouped[categoryId].items.push({
				name: itemData.name,
				price: priceFormatted,
				description: itemData.description ?? undefined,
			});
		});

		// Sort categories by Square's configured order (category_data.parent_
		// category.ordinal). Square doesn't appear to expose a reliable
		// per-item order via the Catalog API, so items within a category are
		// alphabetical.
		return Object.keys(grouped)
			.sort((a, b) => (categoryOrdinalMap[a] ?? 999) - (categoryOrdinalMap[b] ?? 999))
			.map(id => ({
				name: grouped[id].name,
				items: [...grouped[id].items].sort((a, b) => a.name.localeCompare(b.name)),
			}))
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
			artist.serviceType === 'local'
				? (artist.services ?? [])
					// Sanity returns `items: null` for a service group with no items
					// added yet — normalize to [] and drop empty groups entirely so
					// we never render a category heading with nothing under it.
					.map((group) => ({ ...group, items: group.items ?? [] }))
					.filter((group) => group.items.length > 0)
				: [];

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

						{/* Name + Role */}
						<div className="px-4 py-3" style={{ background: "var(--color-primary)", borderRadius: "0.5rem" }}>
							<h1 className="m-0 text-white font-bold text-2xl leading-snug">{artist.name}</h1>
							<p className="m-0 text-white text-sm mt-1" style={{ opacity: 0.9 }}>{artist.role}</p>
						</div>

						{/* Promo */}
						{artist.promo && (
							<div className="px-4 py-3 text-sm font-semibold text-white text-center" style={{ background: "var(--color-promo)", borderRadius: "0.5rem" }}>
								{artist.promo}
							</div>
						)}

						{/* Not accepting */}
						{!artist.isAcceptingNewClients && (
							<p className="text-sm font-bold text-center px-4 py-2 rounded m-0" style={{ background: "var(--color-secondary)", color: "var(--color-dark)" }}>
								Currently Not Accepting New Clients
							</p>
						)}

						{/* Desktop booking buttons — phone number shown under Text/Call so
						    clients (particularly older ones) can jot it down instead of
						    relying on the tel:/sms: link working on their device. */}
						{hasBooking && (
							<div className="hidden md:flex flex-wrap gap-3">
								{artist.onlineBookingLink && (
									<a href={artist.onlineBookingLink} target="_blank" rel="noopener noreferrer" className="text-white text-sm px-4 py-2 rounded transition hover:opacity-90" style={{ background: "var(--color-primary)" }}>
										Book Online
									</a>
								)}
								{artist.textBookingPhoneNumber && (
									<a href={`sms:${artist.textBookingPhoneNumber}`} className="flex flex-col items-center text-white text-sm px-4 py-2 rounded transition hover:opacity-90" style={{ background: "var(--color-dark)" }}>
										Text to Book
										<span className="text-xs" style={{ opacity: 0.85 }}>{formatPhoneNumber(artist.textBookingPhoneNumber)}</span>
									</a>
								)}
								{artist.callBookingPhoneNumber && (
									<a href={`tel:${artist.callBookingPhoneNumber}`} className="flex flex-col items-center text-white text-sm px-4 py-2 rounded transition hover:opacity-90" style={{ background: "var(--color-dark)" }}>
										Call to Book
										<span className="text-xs" style={{ opacity: 0.85 }}>{formatPhoneNumber(artist.callBookingPhoneNumber)}</span>
									</a>
								)}
							</div>
						)}

						{/* Bio — desktop only. Fills the empty space beside the photo
						    instead of repeating full-width below the hero row. */}
						<div className="hidden md:block mt-2">
							<h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-dark)" }}>About</h2>
							<div className="px-4 py-3 text-sm leading-relaxed" style={{ background: "var(--color-tertiary)", border: "1px solid var(--color-dark-10)", borderRadius: "0.5rem", color: "var(--color-dark)", whiteSpace: "pre-line" }}>
								{artist.bio}
							</div>
						</div>
					</div>
				</div>

				{/* Bio — mobile only (see desktop version inside the hero row above).
				    id="bio-mobile" is the deep-link target for the artist card list's
				    "Read more" link (components/artistBioLink.tsx), which jumps here
				    when a card's clamped bio is actually cut off. scrollMarginTop
				    keeps the heading from landing flush against the viewport edge
				    when the browser scrolls to the anchor. */}
				<div id="bio-mobile" className="mt-6 md:hidden" style={{ scrollMarginTop: "1rem" }}>
					<h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-dark)" }}>About</h2>
					<div className="px-4 py-3 text-sm leading-relaxed" style={{ background: "var(--color-tertiary)", border: "1px solid var(--color-dark-10)", borderRadius: "0.5rem", color: "var(--color-dark)", whiteSpace: "pre-line" }}>
						{artist.bio}
					</div>
				</div>

				{/* Gallery */}
				{artist.gallery && artist.gallery.length > 0 && (
					<ImageCarousel gallery={artist.gallery} />
				)}

				{/* Social links — placed after the gallery as a prompt to see more
				    photos, centered and sized up on mobile so they're easy to tap. */}
				{(artist.instagramLink || artist.facebookLink) && (
					<div className="mt-6 flex flex-col items-center gap-3 text-center">
						<p className="m-0 text-sm font-semibold" style={{ color: "var(--color-dark-66)" }}>
							See more photos on social media
						</p>
						<div className="flex justify-center items-center gap-6">
							{artist.instagramLink && (
								<a href={artist.instagramLink} target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition" style={{ color: "var(--color-dark)" }} aria-label="Instagram">
									<FaInstagram className="w-9 h-9 md:w-7 md:h-7" />
								</a>
							)}
							{artist.facebookLink && (
								<a href={artist.facebookLink} target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition" style={{ color: "var(--color-dark)" }} aria-label="Facebook">
									<FaFacebook className="w-9 h-9 md:w-7 md:h-7" />
								</a>
							)}
						</div>
					</div>
				)}

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

			</main>

			<StickyBookingBar artist={artist} hasBooking={!!hasBooking} />
		</>
	);
}
