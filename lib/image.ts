import { sanityClient } from "@/lib/sanity";
import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";

const builder = createImageUrlBuilder(sanityClient);

export function urlFor(source: SanityImageSource) {
	return builder.image(source);
}
