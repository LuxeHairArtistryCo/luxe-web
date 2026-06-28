'use client';

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { SiteSettings } from '@/lib/types'
import { urlFor } from '@/lib/image'

type Props = { settings: SiteSettings }

export default function Header({ settings }: Props) {
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<header style={{ background: "var(--color-dark)" }} className="shadow">
			<div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">

				{/* Logo */}
				<Link href="/" className="flex items-center" onClick={() => setMenuOpen(false)}>
					{settings.logo
						? <Image
							src={urlFor(settings.logo).height(150).url()}
							alt={settings.companyName}
							width={188}
							height={75}
							style={{ width: "auto", height: "75px" }}
						/>
						: <span className="text-xl font-bold text-white">{settings.companyName}</span>
					}
				</Link>

				{/* Desktop nav */}
				<nav className="hidden md:flex gap-6 items-center" style={{ color: "var(--color-light)" }}>
					<Link href="/hairstylists" className="hover:opacity-75 transition">Hairstylists</Link>
					<Link href="/aestheticians" className="hover:opacity-75 transition">Aestheticians</Link>
					{settings.ctaLink && (
						<a href={settings.ctaLink} target="_blank" rel="noopener noreferrer" className="text-sm px-4 py-2 rounded-full font-semibold hover:opacity-90 transition" style={{ background: "var(--color-light)", color: "var(--color-primary)" }}>
							{settings.ctaText ?? 'Book Now'}
						</a>
					)}
				</nav>

				{/* Mobile hamburger */}
				<div
					className="md:hidden flex flex-col justify-center items-center gap-1.5 p-2 cursor-pointer"
					onClick={() => setMenuOpen(prev => !prev)}
					role="button"
					aria-label="Toggle menu"
				>
					<span className="block w-6 h-0.5 transition-all" style={{ background: "var(--color-light)", transform: menuOpen ? "rotate(45deg) translateY(8px)" : "none" }} />
					<span className="block w-6 h-0.5 transition-all" style={{ background: "var(--color-light)", opacity: menuOpen ? 0 : 1 }} />
					<span className="block w-6 h-0.5 transition-all" style={{ background: "var(--color-light)", transform: menuOpen ? "rotate(-45deg) translateY(-8px)" : "none" }} />
				</div>
			</div>

			{/* Mobile dropdown */}
			{menuOpen && (
				<div className="md:hidden" style={{ background: "#2d3238", borderTop: "1px solid var(--color-dark-33)" }}>
					<nav className="flex flex-col px-4 py-3 gap-4">
						<Link href="/hairstylists" className="text-white text-base hover:opacity-75 transition" onClick={() => setMenuOpen(false)}>
							Hairstylists
						</Link>
						<Link href="/aestheticians" className="text-white text-base hover:opacity-75 transition" onClick={() => setMenuOpen(false)}>
							Aestheticians
						</Link>
						{settings.ctaLink && (
							<a href={settings.ctaLink} target="_blank" rel="noopener noreferrer" className="text-sm px-4 py-2 rounded-full font-semibold text-center hover:opacity-90 transition" style={{ background: "var(--color-primary)", color: "var(--color-light)" }} onClick={() => setMenuOpen(false)}>
								{settings.ctaText ?? 'Book Now'}
							</a>
						)}
					</nav>
				</div>
			)}
		</header>
	)
}