import { GuildFeature } from "discord.js";

export type DiscoveryCategory = {
  id: number,
  is_primary: boolean,
  name: string,
}

export type GuildDiscoveryInfo = {
  id: string,
  name: string,
  description: string,
  icon: string | null | undefined,
  splash?: string | null | undefined,
  discovery_splash?: string | null | undefined,
  banner?: string | null | undefined,
  approximate_presence_count: number,
  approximate_member_count: number,
  premium_subscription_count: number,
  preferred_locale: string,
  /**
   * Presumably used for if the guild can be used as a template
   */
  is_published: boolean,
  /**
   * Keywords found by the search engine for discovery
  */
  keywords: string[],
  /** An ID corresponding to a discovery category */
  primary_category_id: number,
  auto_removed: boolean,
  vanity_url_code: string,
  features: GuildFeature[],
}

export type GuildDiscoveryRequest = {
  /**
   * Guilds recommended for this user. Seems to be based
   * off of activity history, but other factors may
   * also come into play.
  */
  recommended_guilds: GuildDiscoveryInfo[],
  /**
   * Purpose unknown. It is speculated that this is the path to an
   * internal record of your recommendations, for some reason sent to the
   * client. Usually begins with server_recs/
   */
  load_id: string,
}
