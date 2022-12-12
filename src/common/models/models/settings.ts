import { DefaultUserSettings, UserSettings as DiscordUserSettings } from "@reflectcord/common/sparkle";
import { QuarkConversion } from "../QuarkConversion";

export type RevoltSetting = [number, string];

export interface RevoltThemeSetting {
  "appearance:theme:base": "light" | "dark",
  "appearance:theme:font": string,
  "appearance:theme:monoFont": string,
}

export interface RevoltSettings {
  appearance: RevoltSetting,
  theme: RevoltSetting
}

export const SettingsKeys = ["appearance", "theme"];

export const UserSettings: QuarkConversion<RevoltSettings, DiscordUserSettings> = {
  async to_quark(settings) {
    return {
      appearance: [Date.now(), ""],
      theme: [Date.now(), ""],
    };
  },

  async from_quark(settings) {
    const themeSettings: RevoltThemeSetting = JSON.parse(settings.theme[1]);

    return {
      ...DefaultUserSettings,
      theme: themeSettings["appearance:theme:base"] === "light" ? "white" : "dark",
    };
  },
};
