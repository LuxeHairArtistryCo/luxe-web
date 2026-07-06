import { sanityClient } from "@/lib/sanity";
import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";

const builder = createImageUrlBuilder(sanityClient);

export function urlFor(source: SanityImageSource) {
	// auto('format') lets Sanity's CDN negotiate the best format for the
	// requesting browser (WebP/AVIF/JPEG) instead of always serving the
	// original upload format — this also sidesteps browsers being unable to
	// render some original formats (e.g. HEIC from iPhones) directly.
	return builder.image(source).auto('format');
}
