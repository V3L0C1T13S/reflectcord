export interface UserSettings {
  id: string;
  afk_timeout?: number;
  allow_accessibility_detection?: boolean;
  animate_emoji?: boolean;
  animate_stickers?: number;
  contact_sync_enabled?: boolean;
  convert_emoticons?: boolean;
  default_guilds_restricted?: boolean;
  detect_platform_accounts?: boolean;
  developer_mode?: boolean;
  disable_games_tab?: boolean;
  enable_tts_command?: boolean;
  explicit_content_filter?: number;
  gateway_connected?: boolean;
  gif_auto_play?: boolean;
  guild_folders?: any[];
  guild_positions?: string[];
  inline_attachment_media?: boolean;
  inline_embed_media?: boolean;
  locale?: string;
  message_display_compact?: boolean;
  native_phone_integration_enabled?: boolean;
  render_embeds?: boolean;
  render_reactions?: boolean;
  restricted_guilds?: string[];
  show_current_game?: boolean;
  status?: string | null;
  stream_notifications_enabled?: boolean;
  theme?: "dark" | "light";
  timezone_offset?: number;
  view_nsfw_guilds?: boolean,
}

export const DefaultUserSettings: UserSettings = {
  id: "0",
  afk_timeout: 3600,
  allow_accessibility_detection: true,
  animate_emoji: true,
  animate_stickers: 0,
  contact_sync_enabled: false,
  convert_emoticons: true,
  default_guilds_restricted: true,
  detect_platform_accounts: true,
  developer_mode: true,
  disable_games_tab: true,
  enable_tts_command: true,
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
  show_current_game: true,
  status: "online",
  stream_notifications_enabled: false,
  theme: "dark",
  timezone_offset: 0,
  view_nsfw_guilds: true,
};
