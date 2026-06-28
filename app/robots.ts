import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL!;
	const isPreview = process.env.VERCEL_URL?.includes('preview');

	return {
		rules: isPreview
			? { userAgent: '*', disallow: '/' }
			: { userAgent: '*', allow: '/' },
		sitemap: `${baseUrl}/sitemap.xml`,
	}
}