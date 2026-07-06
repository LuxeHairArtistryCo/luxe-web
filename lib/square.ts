// Minimal typings for the subset of Square's Catalog API this app actually
// reads. This is NOT a full model of Square's API (their real CatalogObject
// union has many more object types and fields) — just enough structure to
// replace `any` with real field names, so a typo or wrong assumption about
// the shape gets caught by the compiler instead of failing silently at
// runtime.

export type SquareMoney = {
	amount: number; awewa
	currency?: string;
};

export type SquareItemVariationData = {
	name?: string;
	price_money?: SquareMoney;
	team_member_ids?: string[];
};

export type SquareItemVariation = {
	id?: string;
	item_variation_data?: SquareItemVariationData;
};

export type SquareItemData = {
	name: string;
	description?: string;
	product_type?: string;
	category_id?: string;
	categories?: { id: string }[];
	variations?: SquareItemVariation[];
};

export type SquareCategoryData = {
	name?: string;
	ordinal?: number;
};

export type SquareCatalogObject = {
	type: string;
	id: string;
	item_data?: SquareItemData;
	category_data?: SquareCategoryData;
};

export type SquareCatalogListResponse = {
	objects?: SquareCatalogObject[];
};
