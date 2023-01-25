/* eslint-disable no-nested-ternary */
/* eslint-disable no-bitwise */
import { DefaultUserSettings, UserSettings as DiscordUserSettings } from "@reflectcord/common/sparkle";
import protobuf from "protobufjs";
import { join } from "path";
import { invert } from "lodash";
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

export interface RevoltTextAndImagesSetting {
  animate_emoji?: boolean,
  gif_auto_play?: boolean,
  render_embeds?: boolean,
}

export interface RevoltSettings {
  appearance?: RevoltSetting,
  theme?: RevoltSetting,
  locale?: RevoltSetting,
  notifications?: RevoltSetting,
  ordering?: RevoltSetting,
  folders?: RevoltSetting,
  user_content?: RevoltSetting,
  text_and_images?: RevoltSetting,
}

export const SettingsKeys = [
  "appearance",
  "theme",
  "locale",
  "notifications",
  "ordering",
  "folders",
  "user_content",
  "text_and_images",
];

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

const discordLocaleMap: Record<string, string> = invert(LocaleMap);

export type UserSettingsATQ = {}

export type UserSettingsAFQ = Partial<{
  status: string | null,
}>

export function createSettingsSyncPOST(settings: RevoltSettings) {
  const settingsObject: Record<string, string> = {};

  Object.entries(settings).forEach(([setting, value]) => {
    // eslint-disable-next-line prefer-destructuring
    settingsObject[setting] = value[1]!;
  });

  return settingsObject;
}

export const UserSettings: QuarkConversion<
RevoltSettings,
DiscordUserSettings,
UserSettingsATQ,
UserSettingsAFQ
> = {
  async to_quark(settings) {
    const locale: RevoltLocaleSetting | null = settings.locale ? {
      lang: discordLocaleMap[settings.locale] ?? "en_US",
    } : null;
    const theme: RevoltThemeSetting | null = settings.theme ? {
      "appearance:theme:base": settings.theme ?? "dark",
      "appearance:theme:font": "Ubuntu",
      "appearance:theme:monoFont": "Ubuntu Mono",
    } : null;
    /*
    const ordering: RevoltOrderingSetting | null = settings.guild_positions
      ? {
        servers: await Promise.all(settings.guild_positions.map((id) => fromSnowflake(id))),
      }
      : null;
    */
    const userContent: DiscordUserSettings["user_content"] = settings.user_content;
    const textAndImages: RevoltTextAndImagesSetting = {
      animate_emoji: !!settings.animate_emoji,
      gif_auto_play: !!settings.gif_auto_play,
      render_embeds: !!settings.render_embeds,
    };

    const rvSettings: RevoltSettings = {
      text_and_images: [Date.now(), JSON.stringify(textAndImages)],
    };

    if (locale) rvSettings.locale = [Date.now(), JSON.stringify(locale)];
    if (theme) rvSettings.theme = [Date.now(), JSON.stringify(theme)];
    // if (ordering) rvSettings.ordering = [Date.now(), JSON.stringify(ordering)];
    if (userContent) rvSettings.user_content = [Date.now(), JSON.stringify(userContent)];

    return rvSettings;
  },

  async from_quark(settings, extra) {
    const themeSettings: RevoltThemeSetting = JSON.parse(settings.theme?.[1] ?? "{}");
    const localeSettings: RevoltLocaleSetting = JSON.parse(settings.locale?.[1] ?? "{}");
    const orderingSettings: RevoltOrderingSetting = JSON.parse(settings.ordering?.[1] ?? "{}");
    const notificationSettings: Partial<RevoltNotificationSetting> = JSON.parse(settings.notifications?.[1] ?? "{}");
    const folderSettings: Partial<RevoltFolderSetting> = JSON.parse(settings.folders?.[1] ?? "{}");
    const userContentSettings: Partial<DiscordUserSettings["user_content"]> = JSON.parse(settings.user_content?.[1] ?? "{}");
    const textAndImages: RevoltTextAndImagesSetting = JSON.parse(settings.text_and_images?.[1] ?? "{}");

    const discordSettings: DiscordUserSettings = {
      ...DefaultUserSettings,
      animate_emoji: textAndImages.animate_emoji ?? !!DefaultUserSettings.animate_emoji,
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
      user_content: userContentSettings ?? null,
      gif_auto_play: textAndImages.gif_auto_play ?? DefaultUserSettings.gif_auto_play!,
      render_embeds: textAndImages.render_embeds ?? DefaultUserSettings.render_embeds!,
    };

    return discordSettings;
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
    userContent: settings.user_content ?? {},
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

  const protoSettings = PreloadedSettings.decode(settings).toJSON();

  const jsonSettings: DiscordUserSettings = {
    ...DefaultUserSettings,
    animate_emoji: !!protoSettings.textAndImages?.animateEmoji?.value,
    afk_timeout: protoSettings.voiceAndVideo?.afkTimeout?.value ?? DefaultUserSettings.afk_timeout,
    developer_mode: protoSettings.appearance?.developerMode ?? DefaultUserSettings.developer_mode,
    locale: protoSettings.localization?.locale?.localeCode ?? DefaultUserSettings.locale,
    timezone_offset: protoSettings.localization?.locale?.timezoneOffset
      ?? DefaultUserSettings.timezone_offset,
    guild_positions: protoSettings.guildFolders?.guildPositions
      ?? DefaultUserSettings.guild_positions,
    status: protoSettings.status?.status?.status ?? DefaultUserSettings.status,
    stream_notifications_enabled: !!protoSettings?.notifications?.notifyFriendsOnGoLive?.value,
    render_embeds: !!protoSettings.textAndImages?.renderEmbeds?.value,
    gif_auto_play: !!protoSettings.textAndImages?.gifAutoPlay?.value,
  };

  if (protoSettings.appearance?.theme) {
    jsonSettings.theme = protoSettings.appearance.theme === "LIGHT" ? "light" : "dark";
  }
  if (protoSettings.userContent) {
    jsonSettings.user_content = protoSettings.userContent;
  }

  return jsonSettings;
}
