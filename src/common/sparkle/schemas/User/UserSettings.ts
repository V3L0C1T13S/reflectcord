import { DiscordClientThemeSetting } from "common/models";

export interface UserGuildChannelOverride {
  channel_id: string;
  collapsed: boolean;
  message_notifications: number;
  mute_config: {
    // ISO 8086 timestamp at which the channel will unmute on its own
    end_time: string;
    selected_time_window: null;
  };
  muted: boolean;
}

export interface UserGuildSetting {
  channel_overrides: UserGuildChannelOverride[];
  flags: number;
  muted: boolean;
  guild_id: string | null;
  hide_muted_channels: boolean;
  message_notifications: number;
  mobile_push: boolean;
  mute_config: any | null;
  mute_scheduled_events: boolean;
  notify_highlights: number;
  suppress_everyone: boolean;
  suppress_roles: boolean;
  version: number;
}

/**
 * Represents a folder with guilds in it.
 * NOTE: When this has no ID, color, and name, it is an
 * unnested guild.
*/
export interface GuildFolder {
  color: number | null;
  guild_ids: string[]; // empty or undefined = delete
  id: string | null;
  name: string | null;
}

export interface UserSettings {
  afk_timeout?: number;
  allow_accessibility_detection?: boolean;
  animate_emoji?: boolean;
  animate_stickers?: number;
  contact_sync_enabled?: boolean;
  convert_emoticons?: boolean;
  custom_status: {
    text: string | null,
    expires_at: string | null,
    emoji_id: string | null,
    emoji_name: string | null,
  } | null,
  default_guilds_restricted?: boolean;
  detect_platform_accounts?: boolean;
  developer_mode?: boolean;
  disable_games_tab?: boolean;
  enable_tts_command?: boolean;
  explicit_content_filter?: number;
  /** V6 - 8 */
  friend_source_flags: {
    all: boolean,
    mutual_friends: boolean,
    mutual_guilds: boolean,
  };
  friend_discovery_flags: number,
  gateway_connected?: boolean;
  gif_auto_play?: boolean;
  guild_folders?: GuildFolder[];
  /**
   * Should we stop sending this? Discord doesn't appear to
   * even use this anymore, and the clients all use guild_folders
   * instead.
   */
  guild_positions?: string[];
  inline_attachment_media?: boolean;
  inline_embed_media?: boolean;
  locale?: string;
  message_display_compact?: boolean;
  native_phone_integration_enabled?: boolean;
  render_embeds?: boolean;
  render_reactions?: boolean;
  restricted_guilds?: string[];
  passwordless: boolean,
  show_current_game?: boolean;
  status?: string | null;
  stream_notifications_enabled?: boolean;
  theme?: "dark" | "light";
  timezone_offset?: number;
  view_nsfw_guilds?: boolean;
  user_guild_settings: UserGuildSetting[];
  // Reflectcord extension to make data storage easier
  user_content?: {
    dismissedContents?: string,
    lastDismissedOutboundPromotionStartDate?: {
      value: string,
    },
    premiumTier0ModalDismissedAt?: {
      timestamp: string,
    }
  } | null;
  client_theme_settings?: DiscordClientThemeSetting;
}

export type APIUserSettingsPATCHResponse = UserSettings & {
  index?: number | string | undefined,
}

export const DefaultUserSettings: UserSettings = {
  afk_timeout: 3600,
  allow_accessibility_detection: true,
  animate_emoji: true,
  animate_stickers: 0,
  contact_sync_enabled: false,
  convert_emoticons: true,
  custom_status: null,
  default_guilds_restricted: true,
  detect_platform_accounts: true,
  developer_mode: true,
  disable_games_tab: true,
  enable_tts_command: true,
  friend_source_flags: {
    all: true,
    mutual_friends: true,
    mutual_guilds: true,
  },
  friend_discovery_flags: 0,
  explicit_content_filter: 0,
  gateway_connected: false,
  gif_auto_play: true,
  guild_folders: [],
  guild_positions: [],
  inline_attachment_media: true,
  inline_embed_media: true,
  locale: "en-US",
  message_display_compact: false,
  native_phone_integration_enabled: true,
  render_embeds: true,
  render_reactions: true,
  restricted_guilds: [],
  passwordless: false,
  show_current_game: true,
  status: "online",
  stream_notifications_enabled: false,
  theme: "dark",
  timezone_offset: 0,
  view_nsfw_guilds: true,
  user_guild_settings: [],
};
