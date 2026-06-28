import Image from "next/image";
import { Artist } from "@/lib/types";
import { urlFor } from "@/lib/image";

type Props = {
	artist: Artist;
	index: number;
};

export default function ArtistCard({ artist, index }: Props) {
	const isEven = index % 2 === 0;
	const basePath = artist.category === "hairstylists" ? "/hairstylists" : "/aestheticians";
	const href = artist.slug?.current ? `${basePath}/${artist.slug.current}` : null;

	const hasBooking =
		artist.isAcceptingNewClients !== false &&
		(artist.onlineBookingLink || artist.textBookingPhoneNumber || artist.callBookingPhoneNumber);

	return (
		<div
			className="my-3 overflow-hidden"
			style={{
				background: "var(--color-tertiary)",
				border: "1px solid var(--color-dark-10)",
				borderRadius: "1rem",
			}}
		>
			{/* ── MOBILE LAYOUT ── */}
			<div className="md:hidden">

				{/* Top row: photo + bio side by side */}
				<div className={`flex ${isEven ? "flex-row" : "flex-row-reverse"}`}>

					{/* Photo — 2:3 ratio */}
					<div className="shrink-0" style={{ position: "relative", width: "40%", aspectRatio: "2/3" }}>
						<Image
							src={urlFor(artist.image).width(400).height(600).fit("crop").url()}
							alt={artist.name}
							fill
							sizes="40vw"
							priority={index === 0}
							className="object-cover"
						/>
					</div>

					{/* Right col: name/role + bio clipped to image height */}
					<div className="flex flex-col flex-1 overflow-hidden" style={{ minWidth: 0 }}>

						{/* Name / Role */}
						<div className="px-3 py-2 shrink-0" style={{ background: "var(--color-primary)" }}>
							<p className="m-0 text-white font-bold text-base leading-snug">{artist.name}</p>
							<p className="m-0 text-white text-sm" style={{ opacity: 0.9 }}>{artist.role}</p>
						</div>

						{/* Bio — clipped to image height with ellipsis */}
						<div
							className="flex-1 px-3 py-2 text-sm leading-relaxed overflow-hidden"
							style={{
								background: "var(--color-tertiary)",
								borderTop: "1px solid var(--color-dark-10)",
								color: "var(--color-dark)",
							}}
						>
							<div style={{
								display: "-webkit-box",
								WebkitBoxOrient: "vertical" as const,
								WebkitLineClamp: "var(--bio-clamp)" as any,
								overflow: "hidden",
							}}>
								{artist.bio}
							</div>
						</div>
					</div>
				</div>

				{/* Promo banner — full width */}
				{artist.promo && (
					<div
						className="px-4 py-3 text-sm font-semibold text-white text-center"
						style={{ background: "var(--color-promo)" }}
					>
						{artist.promo}
					</div>
				)}

				{/* CTA buttons — full width background, constrained buttons */}
				<div
					className="px-4 py-3"
					style={{
						background: "var(--color-secondary)",
						borderTop: "1px solid var(--color-dark-10)",
					}}
				>
					<div className="flex flex-col items-stretch gap-3 max-w-xs mx-auto px-8">
						{hasBooking && (
							<>
								{artist.onlineBookingLink && (
									<a href={artist.onlineBookingLink} target="_blank" rel="noopener noreferrer" className="text-center text-white text-sm px-3 py-2 rounded transition hover:opacity-90" style={{ background: "var(--color-primary)" }}>
										Book Online
									</a>
								)}
								{artist.textBookingPhoneNumber && (
									<a href={`sms:${artist.textBookingPhoneNumber}`} className="text-center text-white text-sm px-3 py-2 rounded transition hover:opacity-90" style={{ background: "var(--color-primary)" }}>
										Text to Book
									</a>
								)}
								{artist.callBookingPhoneNumber && (
									<a href={`tel:${artist.callBookingPhoneNumber}`} className="text-center text-white text-sm px-3 py-2 rounded transition hover:opacity-90" style={{ background: "var(--color-primary)" }}>
										Call to Book
									</a>
								)}
							</>
						)}

						{!artist.isAcceptingNewClients && (
							<p className="text-sm font-bold text-center m-0 py-1" style={{ color: "var(--color-dark)" }}>
								Not Accepting New Clients
							</p>
						)}

						{href && (
							<a href={href} className="text-center text-white text-sm px-3 py-2 rounded transition hover:opacity-90" style={{ background: "var(--color-dark)" }}>
								View Profile & Services
							</a>
						)}
					</div>
				</div>
			</div>

			{/* ── DESKTOP LAYOUT ── */}
			<div className={`hidden md:flex ${isEven ? "flex-row" : "flex-row-reverse"}`}>

				{/* Photo */}
				<div className="shrink-0" style={{ position: "relative", width: "240px", aspectRatio: "2/3" }}>
					<Image
						src={urlFor(artist.image).width(600).height(900).fit("crop").url()}
						alt={artist.name}
						fill
						sizes="280px"
						priority={index === 0}
						className="object-cover"
					/>
				</div>

				{/* Content */}
				<div className="flex flex-col flex-1" style={{ minWidth: 0 }}>

					{/* Name / Role */}
					<div className="px-4 py-2" style={{ background: "var(--color-primary)" }}>
						<p className="m-0 text-white font-bold text-lg leading-snug">{artist.name}</p>
						<p className="m-0 text-white text-sm" style={{ opacity: 0.9 }}>{artist.role}</p>
					</div>

					{artist.promo && (
						<div
							className="px-4 py-3 text-sm font-semibold text-white text-center"
							style={{ background: "var(--color-promo)" }}
						>
							{artist.promo}
						</div>
					)}

					{/* Bio */}
					<div
						className="flex-1 px-4 py-3 text-sm leading-relaxed"
						style={{
							background: "var(--color-tertiary)",
							borderTop: "1px solid var(--color-dark-10)",
							borderBottom: "1px solid var(--color-dark-10)",
							color: "var(--color-dark)",
							whiteSpace: "pre-line",
						}}
					>
						{artist.bio}
					</div>

					<BookingBar artist={artist} hasBooking={!!hasBooking} href={href} />
				</div>
			</div>
		</div>
	);
}

type BookingBarProps = {
	artist: Artist;
	hasBooking: boolean;
	href: string | null;
};

function BookingBar({ artist, hasBooking, href }: BookingBarProps) {
	return (
		<div
			className="px-3 py-2"
			style={{
				background: "var(--color-secondary)",
				borderTop: "1px solid var(--color-dark-10)",
			}}
		>
			<div className="flex flex-wrap items-center justify-center gap-4 py-1">

				{hasBooking && (
					<>
						{artist.onlineBookingLink && (
							<a href={artist.onlineBookingLink} target="_blank" rel="noopener noreferrer" className="text-white text-sm px-3 py-1 rounded transition hover:opacity-90" style={{ background: "var(--color-primary)" }}>
								Book Online
							</a>
						)}
						{artist.textBookingPhoneNumber && (
							<a href={`sms:${artist.textBookingPhoneNumber}`} className="text-white text-sm px-3 py-1 rounded transition hover:opacity-90" style={{ background: "var(--color-primary)" }}>
								Text to Book
							</a>
						)}
						{artist.callBookingPhoneNumber && (
							<a href={`tel:${artist.callBookingPhoneNumber}`} className="text-white text-sm px-3 py-1 rounded transition hover:opacity-90" style={{ background: "var(--color-primary)" }}>
								Call to Book
							</a>
						)}
					</>
				)}

				{!artist.isAcceptingNewClients && (
					<p className="text-sm font-bold text-center m-0" style={{ color: "var(--color-dark)" }}>
						Currently Not Accepting New Clients
					</p>
				)}

				{href && (
					<a href={href} className="text-white text-sm px-3 py-1 rounded transition hover:opacity-90" style={{ background: "var(--color-dark)" }}>
						View Profile & Services
					</a>
				)}
			</div>
		</div>
	);
}