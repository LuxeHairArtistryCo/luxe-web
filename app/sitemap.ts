import { MetadataRoute } from 'next'
import { sanityClient } from '@/lib/sanity'
import { ARTIST_QUERY } from '@/lib/queries'
import { Artist } from '@/lib/types'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL!;

	const artists: Artist[] = await sanityClient.fetch(ARTIST_QUERY);

	const artistUrls = artists
		.filter(a => a.slug?.current)
		.map(a => ({
			url: `${baseUrl}/${a.category}/${a.slug.current}`,
			lastModified: new Date(),
			changeFrequency: 'monthly' as const,
			priority: 0.8,
		}));

	return [
		{ url: baseUrl, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 1 },
		{ url: `${baseUrl}/hairstylists`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.9 },
		{ url: `${baseUrl}/aestheticians`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.9 },
		{ url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
		...artistUrls,
	];
}