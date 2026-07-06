import Image from "next/image";
import { getCachedSiteSettings } from "@/lib/sanity";
import { urlFor } from "@/lib/image";

export default async function AboutPage() {
	const settings = await getCachedSiteSettings();
	const hours = settings.hours ?? [];

	return (
		<main className="max-w-4xl mx-auto px-4 py-12">
			<h1 className="text-2xl md:text-3xl font-bold mb-8 text-center" style={{ color: "var(--color-dark)" }}>
				About {settings.companyName}
			</h1>

			<div className="flex flex-col md:flex-row gap-8 items-start">
				{settings.aboutImage && (
					<div className="shrink-0 mx-auto md:mx-0 overflow-hidden" style={{ position: "relative", width: "100%", maxWidth: "360px", aspectRatio: "4/3", borderRadius: "1rem", background: "var(--color-secondary)" }}>
						<Image
							src={urlFor(settings.aboutImage).width(720).height(540).fit("crop").url()}
							alt={settings.companyName}
							fill
							sizes="(max-width: 768px) 100vw, 360px"
							className="object-cover"
						/>
					</div>
				)}

				{settings.aboutText && (
					<div className="text-sm leading-relaxed flex-1" style={{ color: "var(--color-dark)", whiteSpace: "pre-line" }}>
						{settings.aboutText}
					</div>
				)}
			</div>

			{(hours.length > 0 || settings.addressLine1 || settings.phone) && (
				<section className="mt-12 px-6 py-6" style={{ background: "var(--color-tertiary)", border: "1px solid var(--color-dark-10)", borderRadius: "1rem" }}>
					<h2 className="text-xl font-bold mb-4 text-center" style={{ color: "var(--color-dark)" }}>Visit Us</h2>
					<div className="grid gap-8 sm:grid-cols-2 max-w-md mx-auto">

						{hours.length > 0 && (
							<div>
								<h3 className="font-bold mb-2 text-sm" style={{ color: "var(--color-dark)" }}>Hours</h3>
								<div className="grid grid-cols-2 text-sm gap-y-0.5" style={{ color: "var(--color-dark-66)" }}>
									{hours.map((entry, i) => (
										<div key={i} style={{ display: 'contents' }}>
											<div className="pe-4">{entry.day}</div>
											<div>{entry.hours}</div>
										</div>
									))}
								</div>
							</div>
						)}

						{(settings.addressLine1 || settings.phone) && (
							<div>
								<h3 className="font-bold mb-2 text-sm" style={{ color: "var(--color-dark)" }}>Contact</h3>
								<div className="text-sm" style={{ color: "var(--color-dark-66)" }}>
									{settings.addressLine1 && <p className="m-0">{settings.addressLine1}</p>}
									{settings.addressLine2 && <p className="m-0">{settings.addressLine2}</p>}
									{settings.phone && (
										<p className="m-0 mt-2">
											<a href={`tel:${settings.phone}`} className="hover:opacity-75 transition" style={{ color: "var(--color-primary)" }}>{settings.phone}</a>
										</p>
									)}
								</div>
							</div>
						)}
					</div>
				</section>
			)}
		</main>
	);
}
