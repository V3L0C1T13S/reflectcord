/* eslint-disable no-nested-ternary */
/* eslint-disable no-bitwise */
import {
  DefaultUserSettings, UserSettings as DiscordUserSettings,
} from "@reflectcord/common/sparkle";
import protobuf from "protobufjs";
import { join } from "path";
import { invert } from "lodash";
import { QuarkConversion } from "../../QuarkConversion";
import {
  multipleFromSnowflake,
  multipleToSnowflake,
  multipleTryFromSnowflake,
  multipleTryToSnowflake,
  toSnowflake,
} from "../../util";

const protoDir = join(__dirname, "../../../../../resources");

const settingsProtoFile = join(protoDir, "PreloadedUserSettings.proto");

export type RevoltSetting = [number, string];

export interface RevoltThemeSetting {
  "appearance:theme:base": "light" | "dark",
  "appearance:theme:font": string,
  "appearance:theme:monoFont": string,
  "appearance:theme:overrides"?: {
    accent?: string, // CSS accent color
    background?: string, // CSS background color
  },
}

export interface RevoltLocaleSetting {
  lang: string;
}

export interface RevoltOrderingSetting {
  servers?: string[];
}

export interface RevoltNotificationSetting {
  server: Record<string, string>;
  channel: Record<string, string>;
}

// Custom - set by Reflectcord
export interface RevoltFolderSetting {
  folders: {
    color: number; // Should we make this match revolts color?
    servers: string[];
    name?: string | null; // Blank name = server names
    id: string,
  }[];
}

export interface RevoltTextAndImagesSetting {
  animate_emoji?: boolean,
  gif_auto_play?: boolean,
  render_embeds?: boolean,
  render_reactions?: boolean,
  convert_emoticons?: boolean,
  inline_attachment_media?: boolean,
  inline_embed_media?: boolean,
  emoji_picker_collapsed_sections?: string[],
}

export interface RevoltInboxSetting {
  current_tab?: number,
  viewed_tutorial?: boolean,
}

export interface DiscordClientThemeSetting {
  primary_color?: string,
  background_gradient_preset_id?: string,
  background_gradient_angle?: number,
}

export interface DiscordSettings {
  client_theme?: DiscordClientThemeSetting;
  mobile_redesign_enabled?: boolean,
  developer_mode?: boolean,
  compact_mode?: boolean,
  status?: {
    show_current_game?: boolean,
  }
}

export interface TutorialSettings {
  suppressed?: boolean,
  confirmed?: string[],
}

export interface RevoltFavorite {
  nickname: string,
  position: number,
  // parent_id: string,
}

export interface RevoltFavoriteSettings {
  favorite_channels: Record<string, RevoltFavorite>;
  muted?: boolean,
}

export interface RevoltSettings {
  discord?: RevoltSetting;
  appearance?: RevoltSetting,
  theme?: RevoltSetting,
  locale?: RevoltSetting,
  notifications?: RevoltSetting,
  ordering?: RevoltSetting,
  folders?: RevoltSetting,
  user_content?: RevoltSetting,
  text_and_images?: RevoltSetting,
  tutorial?: RevoltSetting,
  inbox_settings?: RevoltSetting,
  favorites?: RevoltSetting,
  frecency_user_settings?: RevoltSetting,
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
  "discord",
  "tutorial",
  "inbox_settings",
  "frecency_user_settings",
  // "favorites",
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
    const ordering: RevoltOrderingSetting | null = settings.guild_positions
      ? {
        servers: await multipleFromSnowflake(settings.guild_positions),
      } : null;
    const folders: RevoltFolderSetting | null = settings.guild_folders ? {
      folders: await Promise.all(settings.guild_folders
        .filter((x) => !!x.id && !!x.guild_ids) // 1. Remove empty folders/guild_positions
        .map(async (x) => ({ // 2. Map valid folders into Revolt
          name: x.name,
          color: x.color || 0,
          servers: await multipleFromSnowflake(x.guild_ids!),
          id: x.id!,
        }))),
    } : null;
    const userContent: DiscordUserSettings["user_content"] = settings.user_content;
    const textAndImages: RevoltTextAndImagesSetting = {
      animate_emoji: !!settings.animate_emoji,
      gif_auto_play: !!settings.gif_auto_play,
      render_embeds: !!settings.render_embeds,
      render_reactions: !!settings.render_reactions,
      convert_emoticons: !!settings.convert_emoticons,
      inline_attachment_media: !!settings.inline_attachment_media,
      inline_embed_media: !!settings.inline_embed_media,
      emoji_picker_collapsed_sections: settings.emoji_picker_collapsed_sections
        ? (await multipleTryFromSnowflake(settings.emoji_picker_collapsed_sections))
          .map((x) => x.toString())
        : [],
    };
    const discord: DiscordSettings = {};
    if (settings.client_theme_settings) discord.client_theme = settings.client_theme_settings;
    if ("mobile_redesign_enabled" in settings) {
      discord.mobile_redesign_enabled = settings.mobile_redesign_enabled;
    }
    if ("developer_mode" in settings) discord.developer_mode = settings.developer_mode;
    if ("message_display_compact" in settings) discord.compact_mode = settings.message_display_compact;
    discord.status ??= {};
    if ("show_current_game" in settings) discord.status.show_current_game = settings.show_current_game;

    const inboxSettings: RevoltInboxSetting = {};
    if (settings.inbox_settings) {
      if ("viewed_tutorial" in settings.inbox_settings) inboxSettings.viewed_tutorial = settings.inbox_settings.viewed_tutorial;
      if ("current_tab" in settings.inbox_settings) inboxSettings.current_tab = settings.inbox_settings.current_tab;
    }

    /**
    const convertedFavorites: Record<string, RevoltFavorite> = {};
    let favorites: RevoltFavoriteSettings | null = null;
    if (settings.favorites) {
      await Promise.all(Object.entries(settings.favorites.favorite_channels)
        .map(async ([id, favorite]) => {
          convertedFavorites[id] = {
            nickname: favorite?.nickname,
            position: favorite?.position,
          };
        }));
      favorites = {
        favorite_channels: convertedFavorites,
        muted: !!settings.favorites.muted,
      };
    }
    */

    const rvSettings: RevoltSettings = {
      text_and_images: [Date.now(), JSON.stringify(textAndImages)],
      inbox_settings: [Date.now(), JSON.stringify(inboxSettings)],
    };

    if (locale) rvSettings.locale = [Date.now(), JSON.stringify(locale)];
    if (theme) rvSettings.theme = [Date.now(), JSON.stringify(theme)];
    if (ordering) rvSettings.ordering = [Date.now(), JSON.stringify(ordering)];
    if (folders) rvSettings.folders = [Date.now(), JSON.stringify(folders)];
    if (userContent) rvSettings.user_content = [Date.now(), JSON.stringify(userContent)];
    if (discord) rvSettings.discord = [Date.now(), JSON.stringify(discord)];
    // if (favorites) rvSettings.favorites = [Date.now(), JSON.stringify(favorites)];

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
    const inboxSettings: RevoltInboxSetting = JSON.parse(settings.inbox_settings?.[1] ?? "{}");
    const customDiscord: DiscordSettings = JSON.parse(settings.discord?.[1] ?? "{}");
    // const favorites: RevoltFavoriteSettings = JSON.parse(settings.favorites?.[1] ?? "{}");

    const clientThemeSettings = customDiscord.client_theme;

    const discordSettings: DiscordUserSettings = {
      ...DefaultUserSettings,
      animate_emoji: textAndImages.animate_emoji ?? !!DefaultUserSettings.animate_emoji,
      convert_emoticons: textAndImages.convert_emoticons ?? !!DefaultUserSettings.convert_emoticons,
      theme: themeSettings["appearance:theme:base"] === "light" ? "light" : "dark",
      locale: LocaleMap[localeSettings["lang"]] ?? "en-US",
      developer_mode: customDiscord.developer_mode ?? !!DefaultUserSettings.developer_mode,
      status: extra?.status ?? null,
      guild_positions: orderingSettings?.servers
        ? await multipleToSnowflake(orderingSettings.servers)
        : [],
      guild_folders: folderSettings.folders
        ? await Promise.all(folderSettings.folders.map(async (x) => ({
          name: x.name ?? null,
          id: x.id,
          guild_ids: await multipleToSnowflake(x.servers),
          color: x.color,
        }))) : [],
      user_guild_settings: [...(notificationSettings.server
        ? await Promise.all((Object.entries(notificationSettings.server)
          .map(async ([server, value]) => ({
            channel_overrides: [],
            flags: 0,
            muted: value === "muted",
            guild_id: await toSnowflake(server),
            hide_muted_channels: false,
            message_notifications: 0,
            mobile_push: true,
            mute_config: null,
            mute_scheduled_events: true,
            notify_highlights: 0,
            suppress_everyone: false,
            suppress_roles: false,
            version: 0,
          })))) : []), {
        channel_overrides: notificationSettings.channel
          ? await Promise.all(Object.entries(notificationSettings.channel)
            .filter(([_, value]) => typeof value === "string") // some settings objects? WTF??
            .map(async ([channel, value]) => ({
              channel_id: await toSnowflake(channel),
              collapsed: false,
              message_notifications: 3,
              mute_config: null,
              muted: value === "muted",
            }))) : [],
        flags: 0,
        guild_id: null,
        hide_muted_channels: false,
        message_notifications: 0,
        mobile_push: true,
        mute_config: null,
        mute_scheduled_events: false,
        muted: false,
        notify_highlights: 0,
        suppress_everyone: false,
        suppress_roles: false,
        version: 0,
      }],
      user_content: userContentSettings ?? null,
      gif_auto_play: textAndImages.gif_auto_play ?? DefaultUserSettings.gif_auto_play!,
      render_embeds: textAndImages.render_embeds ?? DefaultUserSettings.render_embeds!,
      render_reactions: textAndImages.render_reactions ?? !!DefaultUserSettings.render_reactions,
      inline_attachment_media: textAndImages.inline_attachment_media
        ?? !!DefaultUserSettings.inline_attachment_media,
      inline_embed_media: textAndImages.inline_embed_media
        ?? !!DefaultUserSettings.inline_embed_media,
      message_display_compact: customDiscord.compact_mode
        ?? !!DefaultUserSettings.message_display_compact,
      inbox_settings: {
        current_tab: inboxSettings.current_tab ?? DefaultUserSettings.inbox_settings?.current_tab!,
        viewed_tutorial: inboxSettings.viewed_tutorial
              ?? DefaultUserSettings.inbox_settings?.viewed_tutorial!,
      },
      emoji_picker_collapsed_sections: textAndImages.emoji_picker_collapsed_sections
        ? await multipleTryToSnowflake(textAndImages.emoji_picker_collapsed_sections)
        : [],
    };

    discordSettings.guild_positions?.forEach((x) => {
      discordSettings.guild_folders?.push({
        name: null,
        id: null,
        guild_ids: [x],
        color: null,
      });
    });

    /**
    if (favorites) {
      const convertedFavorites: Record<string, FavoriteChannel> = {};
      if (favorites.favorite_channels) {
        await Promise.all(Object.entries(favorites.favorite_channels)
          .map(async ([id, favorite]) => {
            convertedFavorites[id] = {
              nickname: favorite.nickname,
              position: favorite?.position,
              type: FavoriteChannelType.ReferenceOriginal,
            };
          }));
      }
      discordSettings.favorites = {
        favorite_channels: convertedFavorites,
        muted: !!favorites.muted,
      };
    }
    */

    if ("mobile_redesign_enabled" in customDiscord) {
      discordSettings.mobile_redesign_enabled = customDiscord.mobile_redesign_enabled;
    }
    if (customDiscord.status) {
      if ("show_current_game" in customDiscord.status) discordSettings.show_current_game = customDiscord.status.show_current_game;
    }

    if (clientThemeSettings) discordSettings.client_theme_settings = clientThemeSettings;

    return discordSettings;
  },
};

export type extraSettingsData = Partial<{
  customStatusText: string | null | undefined,
}>;

/**
 * This is a workaround for the protobuf parser
 * thinking that we want enums as their string value
 *
 * Spoiler alert: we want the exact opposite
*/
const inboxTabs: Record<string, number> = {
  UNSPECIFIED: 0,
  MENTIONS: 1,
  UNREADS: 2,
  TODOS: 3,
  FOR_YOU: 4,
};

export async function settingsToProtoBuf(settings: DiscordUserSettings, extra?: extraSettingsData) {
  const root = await protobuf.load(settingsProtoFile);

  const PreloadedSettings = root.lookupType("PreloadedUserSettings");

  const payload: any = {
    versions: {
      client_version: 1 | 0,
      server_version: 1 | 0,
      data_version: 1 | 0,
    },
    inbox: {
      currentTab: settings.inbox_settings?.current_tab ?? 0,
      viewedTutorial: !!settings.inbox_settings?.viewed_tutorial,
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
      emojiPickerCollapsedSections: settings.emoji_picker_collapsed_sections ?? [],
    },
    notifications: {
      notifyFriendsOnGoLive: {
        value: settings.stream_notifications_enabled,
      },
    },
    status: {
      status: {
        value: settings.status,
      },
      showCurrentGame: {
        value: settings.show_current_game,
      },
    },
    localization: {
      locale: {
        localeCode: {
          value: settings.locale,
        },
        timezoneOffset: {
          value: settings.timezone_offset,
        },
      },
    },
    appearance: {
      theme: settings.theme === "light" ? 2 : 1,
      developerMode: settings.developer_mode,
      clientThemeSettings: settings.client_theme_settings ? {
        primaryColor: { value: settings.client_theme_settings.primary_color },
        backgroundGradientPresetId: {
          value: settings.client_theme_settings.background_gradient_preset_id,
        },
        backgroundGradientAngle: {
          value: settings.client_theme_settings.background_gradient_angle,
        },
      } : undefined,
      mobileRedesignDisabled: !!settings.mobile_redesign_enabled,
    },
    guildFolders: {
      folders: settings.guild_folders
        ?.filter((x) => !!x.id) // FIXME: Discord crashes if you have unnested guilds here
        ?.map((x) => ({
          guildIds: x.guild_ids,
          id: x.id ? { value: x.id } : undefined,
          name: x.name ? { value: x.name } : undefined,
          color: x.color ? { value: x.color } : undefined,
        })) ?? [],
      guildPositions: settings.guild_positions,
    },
    favorites: settings.favorites ? {
      favoriteChannels: settings.favorites.favorite_channels,
      muted: !!settings.favorites?.muted,
    } : undefined,
  };

  if (extra?.customStatusText) {
    payload.status.customStatus = {
      text: extra.customStatusText,
    };
  }

  const res = PreloadedSettings.encode(payload).finish();

  return res;
}

const parseGoogleProtobufBool = (
  val: { value?: boolean },
  fallback: boolean,
) => (val ? !!val.value : fallback);

/**
 * Convert a settings protocol buffer into plain JSON
 * @param settings The Uint8Array buffer for the settings
 * @param current Current JSON settings. Needed for partial updates, otherwise resort to defaults.
 * @returns Protobuf settings in their JSON equivalents.
 */
export async function settingsProtoToJSON(settings: Uint8Array, current?: DiscordUserSettings) {
  const root = await protobuf.load(settingsProtoFile);

  const PreloadedSettings = root.lookupType("PreloadedUserSettings");

  PreloadedSettings.verify(settings);

  const protoSettings = PreloadedSettings.decode(settings).toJSON();

  const fallbackSettings = current ?? DefaultUserSettings;

  // TODO: rework this garbage since it doesn't work well with partials
  const jsonSettings: DiscordUserSettings = {
    ...fallbackSettings,
    animate_emoji: parseGoogleProtobufBool(
      protoSettings.textAndImages?.animateEmoji,
      !!fallbackSettings.animate_emoji,
    ),
    afk_timeout: protoSettings.voiceAndVideo?.afkTimeout?.value ?? fallbackSettings.afk_timeout,
    locale: protoSettings.localization?.locale?.localeCode?.value ?? fallbackSettings.locale,
    timezone_offset: protoSettings.localization?.locale?.timezoneOffset?.value
      ?? fallbackSettings.timezone_offset,
    guild_positions: protoSettings.guildFolders?.guildPositions
      ?? fallbackSettings.guild_positions,
    guild_folders: protoSettings.guildFolders?.folders?.map((x: any) => ({
      guild_ids: x.guildIds,
      id: x.id?.value,
      name: x.name?.value,
      color: x.color?.value?.toNumber(),
    })) ?? [],
    status: protoSettings.status?.status?.value ?? fallbackSettings.status,
    stream_notifications_enabled: parseGoogleProtobufBool(
      protoSettings?.notifications?.notifyFriendsOnGoLive,
      !!fallbackSettings.stream_notifications_enabled,
    ),
    render_embeds: parseGoogleProtobufBool(
      protoSettings.textAndImages?.renderEmbeds,
      !!fallbackSettings.render_embeds,
    ),
    render_reactions: parseGoogleProtobufBool(
      protoSettings.textAndImages?.renderReactions,
      !!fallbackSettings.render_reactions,
    ),
    convert_emoticons: parseGoogleProtobufBool(
      protoSettings.textAndImages?.convertEmoticons,
      !!fallbackSettings.convert_emoticons,
    ),
    gif_auto_play: parseGoogleProtobufBool(
      protoSettings.textAndImages?.gifAutoPlay,
      !!fallbackSettings.gif_auto_play,
    ),
    show_current_game: parseGoogleProtobufBool(
      protoSettings.status?.showCurrentGame,
      !!fallbackSettings.show_current_game,
    ),
    message_display_compact: parseGoogleProtobufBool(
      protoSettings?.textAndImages?.messageDisplayCompact,
      !!fallbackSettings.message_display_compact,
    ),
    inline_attachment_media: parseGoogleProtobufBool(
      protoSettings.textAndImages?.inlineAttachmentMedia,
      !!fallbackSettings.inline_attachment_media,
    ),
    inline_embed_media: parseGoogleProtobufBool(
      protoSettings.textAndImages?.inlineEmbedMedia,
      !!fallbackSettings.inline_embed_media,
    ),
    emoji_picker_collapsed_sections: protoSettings.textAndImages?.emojiPickerCollapsedSections
      ?? [],
  };

  if (protoSettings.appearance) {
    jsonSettings.developer_mode = !!protoSettings.appearance.developerMode;
    jsonSettings.mobile_redesign_enabled = !!protoSettings.appearance.mobileRedesignEnabled;
  }

  if (protoSettings.inbox) {
    jsonSettings.inbox_settings = {
      current_tab: inboxTabs[protoSettings.inbox.currentTab
        ?? fallbackSettings.inbox_settings?.current_tab] ?? 0,
      viewed_tutorial: protoSettings.inbox.viewedTutorial
        ?? fallbackSettings.inbox_settings?.viewed_tutorial,
    };
  }

  /**
  if (protoSettings.favorites) {
    jsonSettings.favorites = {
      favorite_channels: protoSettings.favorites.favoriteChannels,
      muted: !!protoSettings.favorites.muted,
    };
  }
  */

  if (protoSettings.appearance?.theme) {
    jsonSettings.theme = protoSettings.appearance.theme === "LIGHT" ? "light" : "dark";
  }
  if (protoSettings.userContent) {
    jsonSettings.user_content = protoSettings.userContent;
  }
  if (protoSettings.appearance?.clientThemeSettings) {
    jsonSettings.client_theme_settings = {
      primary_color: protoSettings.appearance.clientThemeSettings.primaryColor?.value,
      // eslint-disable-next-line max-len
      background_gradient_preset_id: protoSettings.appearance.clientThemeSettings.backgroundGradientPresetId?.value,
      // eslint-disable-next-line max-len
      background_gradient_angle: protoSettings.appearance.clientThemeSettings.backgroundGradientAngle?.value,
    };
  }

  return jsonSettings;
}
