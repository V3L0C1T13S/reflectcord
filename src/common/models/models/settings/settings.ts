/* eslint-disable no-bitwise */
import { DefaultUserSettings, UserSettings as DiscordUserSettings } from "@reflectcord/common/sparkle";
import protobuf from "protobufjs";
import { join } from "path";
import { Logger } from "@reflectcord/common/utils";
import { QuarkConversion } from "../../QuarkConversion";
import { toSnowflake } from "../../util";

const protoDir = join(__dirname, "../../../../../resources");

const settingsProtoFile = join(protoDir, "PreloadedUserSettings.proto");

export type RevoltSetting = [number, string];

export interface RevoltThemeSetting {
  "appearance:theme:base": "light" | "dark",
  "appearance:theme:font": string,
  "appearance:theme:monoFont": string,
}

export interface RevoltLocaleSetting {
  lang: string;
}

export interface RevoltOrderingSetting {
  servers?: string[];
}

export interface RevoltNotificationSetting {
  server: Record<string, string>;
}

// Custom - set by Reflectcord
export interface RevoltFolderSetting {
  folders: {
    color: number;
    servers: string[];
    name: string;
  }[];
}

export interface RevoltSettings {
  appearance?: RevoltSetting,
  theme?: RevoltSetting,
  locale?: RevoltSetting,
  notifications?: RevoltSetting,
  ordering?: RevoltSetting,
  folders?: RevoltSetting,
}

export const SettingsKeys = ["appearance", "theme", "locale", "notifications", "ordering", "folders"];

const LocaleMap: Record<string, string> = {
  bg: "bg",
  cs: "cs",
  da: "da",
  de: "de",
  el: "el",
  en_US: "en-US",
  en: "en-GB",
  es: "es-ES",
  fi: "fi",
  fr: "fr",
  hi: "hi",
  hr: "hr",
  hu: "hu",
  it: "it",
  ja: "ja",
  ko: "ko",
  lt: "lt",
  nb_NO: "no",
  nl: "nl",
  pl: "pl",
  pt_BR: "pt-BR",
  ro: "ro",
  ru: "ru",
  sv: "sv-SE",
  th: "th",
  tr: "tr",
  uk: "uk",
  vi: "vi",
  zh_Hans: "zh-CN",
  zh_Hant: "zh-TW",
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
    const notificationSettings: Partial<RevoltNotificationSetting> = JSON.parse(settings.notifications?.[1] ?? "{}");
    const folderSettings: Partial<RevoltFolderSetting> = JSON.parse(settings.folders?.[1] ?? "{}");

    return {
      ...DefaultUserSettings,
      theme: themeSettings["appearance:theme:base"] === "light" ? "light" : "dark",
      locale: LocaleMap[localeSettings["lang"]] ?? "en-US",
      guild_positions: orderingSettings?.servers
        ? await Promise.all(orderingSettings.servers.map((x) => toSnowflake(x)))
        : [],
      developer_mode: true,
      status: extra?.status ?? null,
      user_guild_settings: notificationSettings.server
        ? await Promise.all((Object.entries(notificationSettings.server)
          .map(async ([server, value]) => ({
            channel_overrides: [],
            flags: 0,
            muted: value === "muted",
            guild_id: await toSnowflake(server),
            hide_muted_channels: false,
            message_notifications: 0,
            mobile_push: false,
            mute_config: null,
            mute_scheduled_events: true,
            notify_highlights: 0,
            suppress_everyone: false,
            suppress_roles: false,
            version: 0,
          })))) : [],
      guild_folders: folderSettings.folders
        ? await Promise.all(folderSettings.folders.map(async (x, i) => ({
          color: x.color,
          guild_ids: await Promise.all(x.servers.map((id) => toSnowflake(id))),
          id: i,
          name: x.name,
        }))) : [],
    };
  },
};

export type extraSettingsData = Partial<{
  customStatusText: string | null | undefined,
}>;

export async function settingsToProtoBuf(settings: DiscordUserSettings, extra?: extraSettingsData) {
  const root = await protobuf.load(settingsProtoFile);

  const PreloadedSettings = root.lookupType("PreloadedUserSettings");

  const payload: any = {
    versions: {
      user_settings: 1 | 0,
      server_version: 1 | 0,
      data_version: 1 | 0,
    },
    inbox: {
      currentTab: 0,
      viewedTutorial: true,
    },
    guilds: {
      channels: [],
      // hub_progess: 1,
      guildOnboardingProgress: 1,
    },
    userContent: {
      // dismissed_contents: 0,
      lastDismissedOutboundPromotionStartDate: {
        value: new Date().toISOString(),
      },
      premiumTier0ModalDismissedAt: {
        timestamp: Date.now(),
      },
    },
    voiceAndVideo: {
      alwaysPreviewVideo: {
        value: true,
      },
      afkTimeout: {
        value: settings.afk_timeout,
      },
      blur: {
        useBlur: false,
      },
    },
    textAndImages: {
      inlineAttachmentMedia: {
        value: settings.inline_attachment_media,
      },
      inlineEmbedMedia: {
        value: settings.inline_embed_media,
      },
      gifAutoPlay: {
        value: settings.gif_auto_play,
      },
      renderEmbeds: {
        value: settings.render_embeds,
      },
      renderReactions: {
        value: settings.render_reactions,
      },
      animateEmoji: {
        value: settings.animate_emoji,
      },
      animateStickers: {
        value: settings.animate_stickers,
      },
      enableTtsCommand: {
        value: settings.enable_tts_command,
      },
      messageDisplayCompact: {
        value: settings.message_display_compact,
      },
      explicit_content_filter: {
        value: settings.explicit_content_filter,
      },
      viewNsfwGuilds: {
        value: settings.view_nsfw_guilds,
      },
      convertEmoticons: {
        value: settings.convert_emoticons,
      },
      expressionSuggestionsEnabled: {
        value: true,
      },
      viewNsfwCommands: {
        value: true,
      },
    },
    notifications: {
      notifyFriendsOnGoLive: {
        value: settings.stream_notifications_enabled,
      },
    },
    status: {
      status: {
        status: settings.status,
      },
      showCurrentGame: {
        value: true,
      },
    },
    localization: {
      locale: {
        localeCode: settings.locale,
        timezoneOffset: {
          offset: settings.timezone_offset,
        },
      },
    },
    appearance: {
      theme: settings.theme === "light" ? 2 : 1,
      developerMode: settings.developer_mode ?? true,
    },
    guildFolders: {
      folders: settings.guild_folders?.map((x) => ({
        guildIds: x.guild_ids,
        id: x.id,
        name: x.name,
      })) ?? [],
      guildPositions: settings.guild_positions,
    },
  };

  if (extra?.customStatusText) {
    payload.status.customStatus = {
      text: extra.customStatusText,
    };
  }

  const res = PreloadedSettings.encode(payload).finish();

  return res;
}

export async function settingsProtoToJSON(settings: Uint8Array) {
  const root = await protobuf.load(settingsProtoFile);

  const PreloadedSettings = root.lookupType("PreloadedUserSettings");

  PreloadedSettings.verify(settings);

  return PreloadedSettings.decode(settings).toJSON();
}

export async function settingsProtoJSONToObject(settings: any) {
  return {
    ...DefaultUserSettings,
    theme: settings.appearance.theme,
  };
}
