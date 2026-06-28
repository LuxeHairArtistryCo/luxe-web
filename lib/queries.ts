export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  companyName, logo, favicon, tagline, heroSubtext,
  seoDescription, announcementBanner,
  phone, addressLine1, addressLine2,
  hours, instagramLink, facebookLink,
  footerCopyright, ctaText, ctaLink
}`;

const ARTIST_FIELDS = `
  _id, name, role, category, priority, image, bio, slug,
  isAcceptingNewClients, promo,
  onlineBookingLink, textBookingPhoneNumber, callBookingPhoneNumber,
  instagramLink, facebookLink,
  serviceType, externalServicesLink,
  services[] {
    name,
    items[] { name, price, description }
  }
`;

export const HAIRSTYLIST_QUERY = `*[_type == "artist" && category == "hairstylists"]{${ARTIST_FIELDS}} | order(priority desc)`;

export const AESTHETICIAN_QUERY = `*[_type == "artist" && category == "aestheticians"]{${ARTIST_FIELDS}} | order(priority desc)`;

export const ARTIST_QUERY = `*[_type == "artist"]{${ARTIST_FIELDS}} | order(priority desc)`;

export const ARTIST_BY_SLUG_QUERY = `*[_type == "artist" && slug.current == $slug][0]{${ARTIST_FIELDS}}`;