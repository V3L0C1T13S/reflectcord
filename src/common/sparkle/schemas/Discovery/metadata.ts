export interface DiscoveryMetadataResponse {
  guild_id: string;
  primary_category_id: number;
  keywords?: string[] | null;
  emoji_discoverability_enabled: boolean;
  partner_actioned_timestamp?: any | null;
  partner_application_timestamp?: any | null;
  is_published: boolean;
  reasons_to_join: any[];
  social_links?: any | null;
  about?: any | null;
  category_ids: string[];
}
