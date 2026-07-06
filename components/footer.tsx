import Image from 'next/image'
import { SiteSettings } from '@/lib/types'
import { urlFor } from '@/lib/image'
import { formatPhoneNumber } from '@/lib/format'

type Props = { settings: SiteSettings }

export default function Footer({ settings }: Props) {
	const hours = settings.hours ?? [];

	return (
		<footer className="mt-12" style={{ background: "var(--color-dark)", color: "var(--color-light)" }}>
			<div className="max-w-6xl mx-auto px-8 py-8 grid gap-8">
				<section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

					{/* Hours — first on mobile */}
					{hours.length > 0 && (
						<div className="order-1 md:order-2">
							<h3 className="font-bold mb-2">Hours of Operation</h3>
							<div className="grid grid-cols-2 text-sm">
								{/* display: 'contents' lets each entry's two divs participate
								    directly in the parent grid, as if this wrapper weren't there.
								    Set as an inline style (not a Tailwind class) because a plain
								    className="contents" was unreliable on mobile Chrome. See
								    README "Conventions" for more. */}
								{hours.map((entry, i) => (
									<div key={i} style={{ display: 'contents' }}>
										<div className="text-end pe-4 py-0.5 opacity-75">{entry.day}</div>
										<div className="py-0.5">{entry.hours}</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Contact — second on mobile */}
					<div className="order-2 md:order-3">
						<h3 className="font-bold mb-2">Contact Us</h3>
						<div className="grid grid-cols-2 text-sm">
							{settings.addressLine1 && (
								<div style={{ display: 'contents' }}>
									<div className="text-end pe-4 py-0.5 opacity-75">Address</div>
									<div className="py-0.5">{settings.addressLine1}</div>
								</div>
							)}
							{settings.addressLine2 && (
								<div style={{ display: 'contents' }}>
									<div className="text-end pe-4 py-0.5"></div>
									<div className="py-0.5">{settings.addressLine2}</div>
								</div>
							)}
							{settings.phone && (
								<div style={{ display: 'contents' }}>
									<div className="text-end pe-4 py-0.5 opacity-75">Phone</div>
									<div className="py-0.5">
										<a href={`tel:${settings.phone}`} className="hover:opacity-75 transition">{formatPhoneNumber(settings.phone)}</a>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Logo — third on mobile, first on desktop */}
					<div className="order-3 md:order-1 flex flex-col items-center md:items-start">
						{settings.logo
							? <Image
								src={urlFor(settings.logo).height(150).url()}
								alt={settings.companyName}
								width={188}
								height={75}
								style={{ width: "auto", height: "75px" }}
							/>
							: <span className="text-lg font-bold">{settings.companyName}</span>
						}
						<div className="flex gap-3 mt-4">
							{settings.instagramLink && (
								<a href={settings.instagramLink} target="_blank" rel="noopener noreferrer" className="text-sm underline hover:opacity-75 transition" style={{ color: "var(--color-light)" }}>
									Instagram
								</a>
							)}
							{settings.facebookLink && (
								<a href={settings.facebookLink} target="_blank" rel="noopener noreferrer" className="text-sm underline hover:opacity-75 transition" style={{ color: "var(--color-light)" }}>
									Facebook
								</a>
							)}
						</div>
					</div>

				</section>

				<div className="text-center text-sm opacity-75">
					© {new Date().getFullYear()} {settings.footerCopyright ?? settings.companyName}. All rights reserved.
				</div>
			</div>
		</footer>
	)
}
