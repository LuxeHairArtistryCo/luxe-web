import Image from "next/image";
import Link from "next/link";
import { sanityClient, getCachedSiteSettings } from "@/lib/sanity";
import { ARTISTS_WITH_PROMO_QUERY } from "@/lib/queries";
import { ArtistPromoTeaser } from "@/lib/types";
import { urlFor } from "@/lib/image";
import HeroSlideshow from "@/components/heroSlideshow";

async function getArtistsWithPromo(): Promise<ArtistPromoTeaser[]> {
	return await sanityClient.fetch<ArtistPromoTeaser[]>(ARTISTS_WITH_PROMO_QUERY, {}, { next: { tags: ['sanity'] } });
}

export default async function HomePage() {
	const settings = await getCachedSiteSettings();
	const promoArtists = await getArtistsWithPromo();

	const keyServices = settings.keyServices ?? [];

	return (
		<main>
			<HeroSlideshow
				images={settings.heroImages ?? []}
				tagline={settings.tagline}
				subtext={settings.heroSubtext}
				ctaText={settings.ctaText}
				ctaLink={settings.ctaLink}
			/>

			{/* Current promos */}
			{promoArtists.length > 0 && (
				<section className="max-w-5xl mx-auto px-4 py-12">
					<h2 className="text-xl font-bold mb-6 text-center" style={{ color: "var(--color-dark)" }}>Current Promotions</h2>
					<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
						{promoArtists.map((artist) => (
							<Link
								key={artist._id}
								href={`/${artist.category}/${artist.slug.current}`}
								className="flex items-start gap-4 overflow-hidden hover:opacity-90 transition p-3"
								style={{ border: "1px solid var(--color-dark-10)", borderRadius: "1rem", background: "var(--color-tertiary)" }}
							>
								{/* Sized closer to the artist card's photo proportion (40% width,
								    2:3) rather than a tiny fixed thumbnail — still smaller than a
								    full-width hero so the promo text stays the focus. */}
								<div className="shrink-0" style={{ position: "relative", width: "38%", aspectRatio: "2/3", borderRadius: "0.5rem", overflow: "hidden", background: "var(--color-secondary)" }}>
									<Image
										src={urlFor(artist.image).width(300).height(450).fit("crop").url()}
										alt={artist.name}
										fill
										sizes="(max-width: 768px) 38vw, 120px"
										className="object-cover"
									/>
								</div>
								<div className="flex-1 min-w-0 flex flex-col gap-2">
									<p className="m-0 text-sm font-bold leading-snug" style={{ color: "var(--color-dark)" }}>{artist.promo}</p>
									{/* Name — same green pill treatment used on artist cards and
									    slug pages, for consistency wherever a name appears. */}
									<div className="inline-block px-3 py-1 rounded-full self-start max-w-full" style={{ background: "var(--color-primary)" }}>
										<p className="m-0 text-white text-xs font-semibold truncate">{artist.name} — {artist.role}</p>
									</div>
								</div>
							</Link>
						))}
					</div>
				</section>
			)}

			{/* Key services */}
			{keyServices.length > 0 && (
				<section className="py-12" style={{ background: "var(--color-tertiary)" }}>
					<div className="max-w-5xl mx-auto px-4">
						<h2 className="text-xl font-bold mb-6 text-center" style={{ color: "var(--color-dark)" }}>What We Offer</h2>
						<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
							{keyServices.map((service, i) => (
								<div key={i} className="px-4 py-4 text-center" style={{ background: "var(--color-light)", border: "1px solid var(--color-dark-10)", borderRadius: "0.75rem" }}>
									<p className="m-0 font-bold" style={{ color: "var(--color-primary)" }}>{service.name}</p>
									{service.description && (
										<p className="m-0 mt-1 text-sm" style={{ color: "var(--color-dark-66)" }}>{service.description}</p>
									)}
								</div>
							))}
						</div>
					</div>
				</section>
			)}

			{/* About teaser */}
			{settings.homeAboutText && (
				<section className="max-w-3xl mx-auto px-4 py-12 text-center">
					<h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-dark)" }}>About {settings.companyName}</h2>
					<p className="text-sm leading-relaxed" style={{ color: "var(--color-dark-66)" }}>{settings.homeAboutText}</p>
					<Link
						href="/about"
						className="inline-block mt-4 text-sm font-semibold hover:opacity-75 transition"
						style={{ color: "var(--color-primary)" }}
					>
						Learn more about us →
					</Link>
				</section>
			)}
		</main>
	);
}
