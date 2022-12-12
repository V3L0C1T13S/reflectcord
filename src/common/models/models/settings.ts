import { DefaultUserSettings, UserSettings as DiscordUserSettings } from "@reflectcord/common/sparkle";
import protobuf from "protobufjs";
import { join } from "path";
import { QuarkConversion } from "../QuarkConversion";

export type RevoltSetting = [number, string];

export interface RevoltThemeSetting {
  "appearance:theme:base": "light" | "dark",
  "appearance:theme:font": string,
  "appearance:theme:monoFont": string,
}

export interface RevoltSettings {
  appearance: RevoltSetting,
  theme: RevoltSetting,
  locale: RevoltSetting,
}

export const SettingsKeys = ["appearance", "theme", "locale"];

const LocaleMap: Record<string, string> = {
  de: "de",
  en_US: "en-US",
  en: "en-GB",
  es: "es-ES",
};

export const UserSettings: QuarkConversion<RevoltSettings, DiscordUserSettings> = {
  async to_quark(settings) {
    return {
      appearance: [Date.now(), ""],
      theme: [Date.now(), ""],
      locale: [Date.now(), JSON.stringify(settings.locale)],
    };
  },

  async from_quark(settings) {
    const themeSettings: RevoltThemeSetting = JSON.parse(settings.theme[1]);
    const localeSettings = JSON.parse(settings.locale[1]);

    return {
      ...DefaultUserSettings,
      theme: themeSettings["appearance:theme:base"] === "light" ? "light" : "dark",
      locale: LocaleMap[localeSettings["lang"]] ?? "en-US",
    };
  },
};

export async function settingsToProtoBuf(settings: DiscordUserSettings) {
  const root = await protobuf.load(join(__dirname, "../../../../resources/PreloadedUserSettings.proto"));

  const PreloadedSettings = root.lookupType("PreloadedUserSettings");

  return PreloadedSettings.encode({
    versions: {
      user_settings: 1,
      server_version: 2,
      data_version: 3,
    },
    inbox: {
      current_tab: 0,
      viewed_tutorial: true,
    },
    guilds: {
      channels: [],
      hub_progess: 0,
      guild_onboarding_progress: 0,
    },
    user_content: {},
    localization: {
      locale: {
        locale_code: settings.locale,
        timezone_offset: {
          offset: settings.timezone_offset,
        },
      },
    },
    appearance: {
      theme: settings.theme === "light" ? 2 : 1,
      developer_mode: settings.developer_mode,
    },
    status_settings: {
      status: {
        status: settings.status,
      },
      custom_status: {},
      show_current_game: {
        value: true,
      },
    },
    voice_and_video: {
      blur: {
        use_blur: false,
      },
    },
  }).finish();
}
