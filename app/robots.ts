import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
	const isPreview = process.env.VERCEL_URL?.includes('preview');

	return {
		rules: isPreview
			? { userAgent: '*', disallow: '/' }
			: { userAgent: '*', allow: '/' },
		sitemap: 'https://luxehairartistry.ca/sitemap.xml',
	}
}