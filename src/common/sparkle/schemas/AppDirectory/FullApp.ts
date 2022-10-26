export interface Emoji {
  name: string;
}

interface Subscriptionplan {
  id: string;
  name: string;
  interval: number;
  interval_count: number;
  tax_inclusive: boolean;
  sku_id: string;
  currency: string;
  price: number;
  price_tier?: any;
}

interface Benefit {
  ref_type: number;
  emoji: Emoji;
  name: string;
  description: string;
}

interface Skubenefits {
  sku_id: string;
  benefits: Benefit[];
}

export interface Subscriptionlisting {
  id: string;
  image_asset?: any;
  subscription_plans: Subscriptionplan[];
  sku_benefits: Skubenefits;
  published: boolean;
  soft_deleted: boolean;
  application_id: string;
  name: string;
  description: string;
}

export interface RootObject {
  id: string;
  subscription_listings_ids: string[];
  application_id: string;
  name: string;
  description: string;
  subscription_listings: Subscriptionlisting[];
}
