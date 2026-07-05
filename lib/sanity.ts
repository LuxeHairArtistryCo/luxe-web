import { createClient } from '@sanity/client'
import { unstable_cache } from 'next/cache'
import { SITE_SETTINGS_QUERY } from './queries'

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  useCdn: true,
  stega: false,
});

export const getCachedSiteSettings = unstable_cache(
  async () => sanityClient.fetch(SITE_SETTINGS_QUERY, {}, { next: { tags: ['sanity'] } }),
  ['site-settings'],
  { revalidate: 3600, tags: ['sanity'] }
);