export interface UserSettings {
  afk_timeout: number;
  allow_accessibility_detection: boolean;
  animate_emoji: boolean;
  animate_stickers: number;
  contact_sync_enabled: boolean;
  convert_emoticons: boolean;
  theme?: "dark" | "white";
}

export const DefaultUserSettings: UserSettings = {
  afk_timeout: 3600,
  allow_accessibility_detection: true,
  animate_emoji: true,
  animate_stickers: 0,
  contact_sync_enabled: false,
  convert_emoticons: true,
  theme: "dark",
};
