import type { SanityImageSource } from "@sanity/image-url";

export type HoursEntry = {
	day: string;
	hours: string;
};

export type SiteSettings = {
	companyName: string;
	logo?: SanityImageSource;
	favicon?: SanityImageSource;
	tagline?: string;
	heroSubtext?: string;
	seoDescription?: string;
	announcementBanner?: string;
	phone?: string;
	addressLine1?: string;
	addressLine2?: string;
	hours?: HoursEntry[];
	instagramLink?: string;
	facebookLink?: string;
	footerCopyright?: string;
	ctaText?: string;
	ctaLink?: string;
};

export type ServiceItem = {
	name: string;
	price?: string;
	description?: string;
};

export type ServiceGroup = {
	name: string;
	items: ServiceItem[];
};

export type Artist = {
	_id: string;
	name: string;
	role: string;
	category: 'hairstylists' | 'aestheticians';
	priority: number;
	image: SanityImageSource;
	bio: string;
	slug: { current: string };
	isAcceptingNewClients: boolean;
	promo?: string;
	onlineBookingLink?: string;
	textBookingPhoneNumber?: string;
	callBookingPhoneNumber?: string;
	instagramLink?: string;
	facebookLink?: string;
	gallery?: {
		image: SanityImageSource;
		caption?: string;
	}[];
	serviceType?: 'local' | 'external' | 'square';
	externalServicesLink?: string;
	services?: ServiceGroup[];
	// squareAccessToken intentionally omitted — never exposed to frontend
	squareTeamMemberId?: string;
	isJuniorStylist?: boolean;
};
