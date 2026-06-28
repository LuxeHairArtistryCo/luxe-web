import Image from "next/image";
import Link from "next/link";
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
		artist.isAcceptingNewClients &&
		(artist.onlineBookingLink || artist.textBookingPhoneNumber || artist.callBookingPhoneNumber);

	return (
		<>
			<main className="max-w-4xl mx-auto px-4 py-12 pb-32 md:pb-12">

				{/* Back link */}
				<Link href="/hairstylists" className="text-primary text-sm font-semibold underline underline-offset-2 hover:opacity-75 transition">
					← Back to Hairstylists
				</Link>

				{/* Hero */}
				<div className="flex flex-col md:flex-row gap-8 mt-6">
					<div className="w-full md:w-1/3 relative aspect-square rounded-2xl overflow-hidden shrink-0">
						<Image
							src={urlFor(artist.image).width(600).height(600).fit("crop").url()}
							alt={artist.name}
							fill
							sizes="(max-width: 768px) 100vw, 33vw"
							priority
							className="object-cover"
						/>
					</div>

					<div className="flex flex-col gap-3 justify-center">
						{/* Promo */}
						{artist.promo && (
							<div className="bg-primary text-light text-sm font-medium px-4 py-2 rounded-lg">
								{artist.promo}
							</div>
						)}

						{/* Name + Role */}
						<div>
							<h1 className="text-3xl font-bold text-dark">{artist.name}</h1>
							<p className="text-dark-66 text-sm">{artist.role}</p>
						</div>

						{/* Not accepting badge */}
						{!artist.isAcceptingNewClients && (
							<span className="inline-block bg-secondary text-dark text-xs font-semibold px-3 py-1 rounded-full w-fit">
								Not accepting new clients
							</span>
						)}

						{/* Desktop booking buttons */}
						{hasBooking && (
							<div className="hidden md:flex flex-wrap gap-2 mt-2">
								{artist.onlineBookingLink && (
									<a href={artist.onlineBookingLink} target="_blank" rel="noopener noreferrer" className="bg-primary text-light text-sm px-4 py-2 rounded-full hover:opacity-90 transition">
										Book Online
									</a>
								)}
								{artist.textBookingPhoneNumber && (
									<a href={`sms:${artist.textBookingPhoneNumber}`} className="bg-secondary text-dark text-sm px-4 py-2 rounded-full hover:opacity-90 transition">
										Text to Book
									</a>
								)}
								{artist.callBookingPhoneNumber && (
									<a href={`tel:${artist.callBookingPhoneNumber}`} className="bg-secondary text-dark text-sm px-4 py-2 rounded-full hover:opacity-90 transition">
										Call to Book
									</a>
								)}
							</div>
						)}

						{/* Social links */}
						<div className="flex gap-3 mt-1">
							{artist.instagramLink && (
								<a href={artist.instagramLink} target="_blank" rel="noopener noreferrer" className="text-primary text-sm font-semibold underline underline-offset-2 hover:opacity-75 transition">
									Instagram
								</a>
							)}
							{artist.facebookLink && (
								<a href={artist.facebookLink} target="_blank" rel="noopener noreferrer" className="text-primary text-sm font-semibold underline underline-offset-2 hover:opacity-75 transition">
									Facebook
								</a>
							)}
						</div>
					</div>
				</div>

				{/* Bio */}
				<div className="mt-10">
					<h2 className="text-xl font-bold text-dark mb-2">About</h2>
					<p className="text-dark-66 leading-relaxed">{artist.bio}</p>
				</div>

				{/* Services */}
				<div className="mt-10">
					<h2 className="text-xl font-bold text-dark mb-4">Services</h2>

					{artist.serviceType === "external" && artist.externalServicesLink && (
						<a href={artist.externalServicesLink} target="_blank" rel="noopener noreferrer" className="bg-primary text-light text-sm px-4 py-2 rounded-full hover:opacity-90 transition">
							View Full Service Menu
						</a>
					)}

					{artist.serviceType === "local" && artist.services && (
						<div className="flex flex-col gap-6">
							{artist.services.map((group, i) => (
								<div key={i}>
									<h3 className="text-lg font-semibold text-dark border-b border-secondary pb-1 mb-3">
										{group.name}
									</h3>
									<div className="flex flex-col gap-2">
										{group.items.map((item, j) => (
											<div key={j} className="flex justify-between items-start gap-4">
												<div>
													<p className="text-dark font-medium">{item.name}</p>
													{item.description && (
														<p className="text-dark-66 text-sm">{item.description}</p>
													)}
												</div>
												{item.price && (
													<span className="text-dark text-sm font-semibold shrink-0">{item.price}</span>
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