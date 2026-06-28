import Image from "next/image";
import Link from "next/link";
import { FaInstagram, FaFacebook } from "react-icons/fa";
import { sanityClient } from "@/lib/sanity";
import { Artist } from "@/lib/types";
import { ARTIST_BY_SLUG_QUERY } from "@/lib/queries";
import { urlFor } from "@/lib/image";
import StickyBookingBar from "@/components/stickyBookingBar";

type Props = {
	params: Promise<{ slug: string }>;
};

async function getArtist(slug: string): Promise<Artist> {
	return await sanityClient.fetch(ARTIST_BY_SLUG_QUERY, { slug });
}

export default async function ArtistPage({ params }: Props) {
	const { slug } = await params;
	const artist = await getArtist(slug);

	const hasBooking =
		artist.isAcceptingNewClients !== false &&
		(artist.onlineBookingLink || artist.textBookingPhoneNumber || artist.callBookingPhoneNumber);

	const backPath = artist.category === "hairstylists" ? "/hairstylists" : "/aestheticians";
	const backLabel = artist.category === "hairstylists" ? "Hairstylists" : "Aestheticians";

	return (
		<>
			<main className="max-w-5xl mx-auto px-4 py-8 pb-32 md:pb-12">

				<Link href={backPath} className="text-sm font-semibold hover:opacity-75 transition mb-6 inline-block" style={{ color: "var(--color-primary)" }}>
					← Back to {backLabel}
				</Link>

				{/* Hero */}
				<div className="flex flex-col md:flex-row gap-8 mt-4">

					{/* Photo */}
					<div className="shrink-0 overflow-hidden" style={{ position: "relative", width: "100%", maxWidth: "280px", aspectRatio: "2/3", borderRadius: "1rem", background: "var(--color-secondary)" }}>
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
				<div className="mt-6">
					<h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-dark)" }}>Services</h2>

					{artist.serviceType === "external" && artist.externalServicesLink && (
						<a href={artist.externalServicesLink} target="_blank" rel="noopener noreferrer" className="text-white text-sm px-4 py-2 rounded transition hover:opacity-90" style={{ background: "var(--color-dark)" }}>
							View Full Service Menu
						</a>
					)}

					{artist.serviceType === "local" && artist.services && (
						<div className="overflow-hidden" style={{ border: "1px solid var(--color-dark-10)", borderRadius: "1rem" }}>
							{artist.services.map((group, i) => (
								<div key={i} style={{ borderBottom: i < artist.services!.length - 1 ? "1px solid var(--color-dark-10)" : "none" }}>
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
				</div>

			</main>

			<StickyBookingBar artist={artist} hasBooking={!!hasBooking} />
		</>
	);
}