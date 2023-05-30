/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
/* eslint-disable no-bitwise */
import {
  APIChannel,
  APIEmoji,
  APIGuild,
  APIGuildMember,
  APIRole,
  APISticker,
  GatewayGuildCreateDispatchData,
  GuildDefaultMessageNotifications,
  GuildExplicitContentFilter,
  GuildFeature,
  GuildMFALevel,
  GuildNSFWLevel,
  GuildPremiumTier,
  GuildSystemChannelFlags,
  GuildVerificationLevel,
  RESTPatchAPIGuildJSONBody,
} from "discord.js";
import { DataEditServer, Server } from "revolt-api";
import { uploadBase64File } from "@reflectcord/cdn/util";
import { API } from "revolt.js";
import { QuarkConversion } from "../../QuarkConversion";
import {
  fromSnowflake, hashToSnowflake, multipleFromSnowflake, toSnowflake,
} from "../../util";
import { convertPermNumber, Permissions } from "../permissions";
import { Role } from "../role";
import {
  createGatewayGuildEmoji, discordGatewayGuildEmoji, Emoji,
} from "../emoji";
import { toCompatibleISO } from "../../../utils/date";
import { PartialFile } from "../attachment";
import { CommonGatewayGuild, UserGatewayGuild } from "../../../sparkle";

export type DiscordPartialGuild = {
  id: string,
  name: string,
  icon: string | null,
  owner: boolean,
  permissions: string,
  features: GuildFeature[],
};

export type revoltPartialServer = {
  _id: Server["_id"],
  name: Server["name"],
  icon?: Server["icon"],
  flags?: Server["flags"],
  owner: Server["owner"]
};

export const stubFeatures = [
  GuildFeature.Banner,
  GuildFeature.AnimatedBanner,
  GuildFeature.AnimatedIcon,
  GuildFeature.Community, // Revolt has *most* equivalents to this feature
];

export function getServerFeatures(server: revoltPartialServer) {
  const features = Array.from(stubFeatures);

  if (server.flags) {
    if (server.flags & 1) {
      features.push(GuildFeature.Partnered);
      features.push(GuildFeature.Verified);
    }
    if (server.flags & 2) features.push(GuildFeature.Verified);
  }

  return features;
}

export type GuildATQ = {
  channels: string[],
};
export type GuildAFQ = Partial<{
  emojis: API.Emoji[] | undefined | null,
  discordEmojis: APIEmoji[] | undefined | null,
}>

export const Guild: QuarkConversion<Server, APIGuild, GuildATQ, GuildAFQ> = {
  async to_quark(guild, extra) {
    const {
      id, name, owner_id, description, nsfw_level, icon, banner, system_channel_id,
    } = guild;

    const _id = await fromSnowflake(id);

    const defaultRole = guild.roles.find((role) => role.id === id);

    return {
      _id,
      owner: await fromSnowflake(owner_id),
      name,
      description,
      channels: extra?.channels
        ? await multipleFromSnowflake(extra.channels)
        : [],
      categories: null,
      system_messages: system_channel_id ? {
        user_joined: await fromSnowflake(system_channel_id),
      } : null,
      roles: {},
      default_permissions: defaultRole
        ? (await Permissions.to_quark(BigInt(defaultRole.permissions))).a
        : 0,
      icon: icon ? await PartialFile.to_quark(icon) : null,
      banner: banner ? await PartialFile.to_quark(banner) : null,
      flags: null,
      nsfw: !!(nsfw_level & GuildNSFWLevel.AgeRestricted),
      analytics: false,
      discoverable: guild.features.includes(GuildFeature.Discoverable),
    };
  },

  async from_quark(server, extra) {
    const {
      _id, name, owner, description, icon, nsfw,
    } = server;

    const id = await toSnowflake(_id);

    const features = getServerFeatures(server);
    if (server.discoverable) features.push(GuildFeature.Discoverable);

    const banner = server.banner ? `${await hashToSnowflake(server.banner._id)}/background/${await hashToSnowflake(server.banner._id)}` : null;

    return {
      id,
      name,
      owner_id: await toSnowflake(owner),
      description: description ?? null,
      region: "deprecated",
      afk_channel_id: null,
      afk_timeout: 300,
      widget_enabled: false,
      widget_channel_id: null,
      verification_level: GuildVerificationLevel.None,
      default_message_notifications: GuildDefaultMessageNotifications.AllMessages,
      explicit_content_filter: GuildExplicitContentFilter.Disabled,
      roles: await (async () => {
        const discordRoles: APIRole[] = [];
        const everyoneStub = {
          id,
          name: "@everyone",
          hoist: false,
          position: 0,
          permissions: convertPermNumber(server.default_permissions).toString(),
          managed: false,
          mentionable: false,
          color: 0,
        };

        discordRoles.push(everyoneStub);

        const roles = server.roles ? await Promise.all(Object.entries(server.roles)
          .map(async ([k, x]) => Role.from_quark(x, k))) : [];
        roles.forEach((x) => discordRoles.push(x));

        return discordRoles;
      })(),
      emojis: extra?.discordEmojis
        ? extra?.discordEmojis
        : extra?.emojis ? await Promise.all(extra.emojis
          .map((x) => Emoji.from_quark(x))) : [],
      features,
      mfa_level: GuildMFALevel.None,
      application_id: null,
      system_channel_id: server.system_messages?.user_joined
        ? await toSnowflake(server.system_messages?.user_joined)
        : null,
      system_channel_flags: GuildSystemChannelFlags.SuppressGuildReminderNotifications,
      rules_channel_id: null,
      max_presences: null,
      max_members: 100000,
      vanity_url_code: server.discoverable ? server._id : null, // TODO: Verify this works
      banner,
      premium_tier: GuildPremiumTier.None,
      premium_subscription_count: 0,
      preferred_locale: "en-US",
      public_updates_channel_id: null,
      nsfw_level: GuildNSFWLevel.Default,
      // FIXME: What constitutes an NSFW server on Discord??
      nsfw,
      stickers: [],
      premium_progress_bar_enabled: false,
      hub_type: null,
      discovery_splash: null,
      icon_hash: icon?._id ?? null,
      icon: icon ? await hashToSnowflake(icon._id) : null,
      splash: null,
      guild_scheduled_events: [],
    };
  },
};

export const PartialGuild: QuarkConversion<revoltPartialServer, DiscordPartialGuild> = {
  async to_quark(data) {
    const {
      id, name, icon, features,
    } = data;

    return {
      _id: await fromSnowflake(id),
      name,
      owner: "0",
      icon: icon ? await PartialFile.to_quark(icon) : null,
    };
  },

  async from_quark(data) {
    const { _id, name, icon } = data;

    return {
      id: await toSnowflake(_id),
      name,
      icon: icon?._id ?? null,
      owner: false,
      permissions: "",
      features: getServerFeatures(data),
    };
  },
};

export const GuildEditBody: QuarkConversion<DataEditServer, RESTPatchAPIGuildJSONBody> = {
  async to_quark(data) {
    const {
      name, description, system_channel_id, icon, banner,
    } = data;

    const iconId = icon && icon.startsWith("data:") ? await uploadBase64File("icons", {
      file: icon,
    }) : null;
    const bannerId = banner && banner.startsWith("data:") ? await uploadBase64File("banners", {
      file: banner,
    }) : null;

    return {
      name: name ?? null,
      description: description ?? null,
      system_messages: system_channel_id ? await (async () => {
        const channelId = await fromSnowflake(system_channel_id);

        return {
          user_joined: channelId,
          user_left: channelId,
          user_kicked: channelId,
          user_banned: channelId,
        };
      })() : null,
      icon: iconId,
      banner: bannerId,
    };
  },

  async from_quark(data) {
    const { name, description, system_messages } = data;

    return {
      name: name ?? undefined,
      description,
      system_channel_id: system_messages?.user_joined
        ? await toSnowflake(system_messages.user_joined)
        : null,
    };
  },
};

type CommonGatewayGuildData = {
  channels: APIChannel[],
  members: APIGuildMember[],
  member?: APIGuildMember | null,
  emojis?: API.Emoji[],
}

type UserGatewayGuildData = CommonGatewayGuildData & {
}

export function createCommonGatewayGuild(
  guild: APIGuild,
  data: CommonGatewayGuildData,
): CommonGatewayGuild {
  return {
    embedded_activities: [],
    channels: data.channels,
    joined_at: data.member?.joined_at ?? toCompatibleISO(new Date().toISOString()),
    large: false,
    member_count: guild.approximate_member_count ?? 0,
    members: data.members,
    threads: [],
    stage_instances: [],
    guild_scheduled_events: [],
    presences: [],
    voice_states: [],
  };
}

export function createBotGatewayGuild(
  guild: APIGuild,
  data: CommonGatewayGuildData,
): GatewayGuildCreateDispatchData {
  return {
    ...guild,
    ...createCommonGatewayGuild(guild, data),
    presences: [],
    voice_states: [],
    unavailable: false,
  };
}

export async function createUserGatewayGuild(
  guild: APIGuild,
  data: UserGatewayGuildData,
) {
  const { emojis } = guild;

  const userGuild: UserGatewayGuild = {
    ...createCommonGatewayGuild(guild, data),
    application_command_counts: {},
    data_mode: "full",
    emojis: emojis
      ?.map((emoji) => createGatewayGuildEmoji(emoji))
      ?? [],
    id: guild.id,
    lazy: true,
    premium_subscription_count: guild.premium_subscription_count ?? 0,
    properties: guild,
    roles: guild.roles,
    stickers: guild.stickers,
    version: 0,
    safety_alerts_channel_id: null,
    home_header: null,
    latest_onboarding_question_id: null,
    max_video_channel_users: 25,
    max_stage_video_channel_users: 50,
  };

  // @ts-ignore
  delete userGuild.members;

  return userGuild;
}

export async function createInitialReadyGuild(
  guild: APIGuild,
  data: UserGatewayGuildData,
) {
  const initialGuild = {
    ...await createUserGatewayGuild(guild, data),
    members: [
      ...data.members,
      data.member,
    ],
    last_messages: [],
    has_threads_subscription: true,
    presences: [],
  };

  return initialGuild;
}
