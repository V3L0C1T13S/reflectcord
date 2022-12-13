/* eslint-disable no-bitwise */
import { DefaultUserSettings, UserSettings as DiscordUserSettings } from "@reflectcord/common/sparkle";
import protobuf from "protobufjs";
import { join } from "path";
import { Logger } from "@reflectcord/common/utils";
import { QuarkConversion } from "../QuarkConversion";
import { toSnowflake } from "../util";

export type RevoltSetting = [number, string];

export interface RevoltThemeSetting {
  "appearance:theme:base": "light" | "dark",
  "appearance:theme:font": string,
  "appearance:theme:monoFont": string,
}

export interface RevoltLocaleSetting {
  lang: string,
}

export interface RevoltOrderingSetting {
  servers?: string[],
}

export interface RevoltSettings {
  appearance?: RevoltSetting,
  theme?: RevoltSetting,
  locale?: RevoltSetting,
  notifications?: RevoltSetting,
  ordering?: RevoltSetting,
}

export const SettingsKeys = ["appearance", "theme", "locale", "notifications", "ordering"];

const LocaleMap: Record<string, string> = {
  de: "de",
  en_US: "en-US",
  en: "en-GB",
  es: "es-ES",
};

export type UserSettingsATQ = {}

export type UserSettingsAFQ = Partial<{
  status: string | null,
}>

export const UserSettings: QuarkConversion<
RevoltSettings,
DiscordUserSettings,
UserSettingsATQ,
UserSettingsAFQ
> = {
  async to_quark(settings) {
    const locale: RevoltLocaleSetting = {
      lang: "en_US",
    };
    const theme: RevoltThemeSetting = {
      "appearance:theme:base": settings.theme ?? "dark",
      "appearance:theme:font": "",
      "appearance:theme:monoFont": "",
    };
    return {
      appearance: [Date.now(), ""],
      theme: [Date.now(), JSON.stringify(theme)],
      locale: [Date.now(), JSON.stringify(locale)],
    };
  },

  async from_quark(settings, extra) {
    const themeSettings: RevoltThemeSetting = JSON.parse(settings.theme?.[1] ?? "{}");
    const localeSettings: RevoltLocaleSetting = JSON.parse(settings.locale?.[1] ?? "{}");
    const orderingSettings: RevoltOrderingSetting = JSON.parse(settings.ordering?.[1] ?? "{}");

    return {
      ...DefaultUserSettings,
      theme: themeSettings["appearance:theme:base"] === "light" ? "light" : "dark",
      locale: LocaleMap[localeSettings["lang"]] ?? "en-US",
      guild_positions: orderingSettings?.servers
        ? await Promise.all(orderingSettings.servers.map((x) => toSnowflake(x)))
        : [],
      developer_mode: true,
      status: extra?.status ?? null,
    };
  },
};

export async function settingsToProtoBuf(settings: DiscordUserSettings) {
  const root = await protobuf.load(join(__dirname, "../../../../resources/PreloadedUserSettings.proto"));

  const PreloadedSettings = root.lookupType("PreloadedUserSettings");

  const payload = {
    versions: {
      user_settings: 1 | 0,
      server_version: 1 | 0,
      data_version: 1 | 0,
    },
    inbox: {
      current_tab: 1,
      viewed_tutorial: true,
    },
    guilds: {
      channels: {},
      hub_progess: 1,
      guild_onboarding_progress: 1,
    },
    user_content: {
      // dismissed_contents: 0,
      last_dismissed_outbound_promotion_start_date: {
        value: new Date().toISOString(),
      },
      premium_tier_0_modal_dismissed_at: {
        timestamp: Date.now(),
      },
    },
    voice_and_video: {
      always_preview_video: {
        value: true,
      },
      afk_timeout: {
        value: settings.afk_timeout,
      },
      blur: {
        use_blur: false,
      },
    },
    text_and_images: {
      render_embeds: {
        value: settings.render_embeds,
      },
      render_reactions: {
        value: settings.render_reactions,
      },
    },
    notifications: {
      notify_friends_on_go_live: {
        value: settings.stream_notifications_enabled,
      },
    },
    status: {
      status: {
        status: settings.status,
      },
      custom_status: {},
      show_current_game: {
        value: true,
      },
    },
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
      developer_mode: settings.developer_mode ?? true,
    },
    guild_folders: {
      guild_positions: settings.guild_positions,
    },
  };

  const res = PreloadedSettings.encode(payload).finish();

  return res;
}
