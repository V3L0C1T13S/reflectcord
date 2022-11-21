/* eslint-disable camelcase */
/* eslint-disable no-bitwise */
import {
  APIGuild,
  APIRole,
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
import { Logger } from "../../../utils";
import { QuarkConversion } from "../../QuarkConversion";
import { fromSnowflake, toSnowflake } from "../../util";
import { Attachment } from "../attachment";
import { convertPermNumber } from "../permissions";
import { Role } from "../role";

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

export const Guild: QuarkConversion<Server, APIGuild> = {
  async to_quark(guild) {
    const {
      id, name, owner_id: ownerId, description,
    } = guild;

    const _id = await fromSnowflake(id);

    return {
      _id,
      owner: await fromSnowflake(ownerId),
      name,
      description,
      channels: [],
      categories: null,
      system_messages: null,
      roles: {},
      default_permissions: 0,
      icon: null,
      banner: null,
      flags: null,
      nsfw: false,
      analytics: false,
      discoverable: false,
    };
  },

  async from_quark(server) {
    const {
      _id, name, owner, description, icon, nsfw,
    } = server;

    const id = await toSnowflake(_id);

    const features = getServerFeatures(server);

    return {
      id,
      name,
      owner_id: await toSnowflake(owner),
      description: description ?? null,
      region: "0",
      afk_channel_id: null,
      afk_timeout: 3600,
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
          color: 0,
          hoist: false,
          position: 0,
          permissions: convertPermNumber(server.default_permissions).toString(),
          managed: false,
          mentionable: true,
        };

        discordRoles.push(everyoneStub);

        const roles = server.roles ? await Promise.all(Object.entries(server.roles)
          .map(async ([k, x]) => Role.from_quark(x, k))) : [];
        roles.forEach((x) => discordRoles.push(x));

        return discordRoles;
      })(),
      emojis: [],
      features,
      mfa_level: GuildMFALevel.None,
      application_id: null,
      system_channel_id: null,
      system_channel_flags: GuildSystemChannelFlags.SuppressGuildReminderNotifications,
      rules_channel_id: null,
      max_presences: null,
      max_members: 100000,
      vanity_url_code: null,
      banner: server.banner ? `${server.banner?._id}/background/${server.banner?._id}` : null,
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
      icon: icon?._id ?? null,
      splash: null,
      guild_scheduled_events: [],
      joined_at: Date.now().toString(),
      // max_video_channel_users: 25,
      // max_stage_video_channel_users: 0,
      stage_instances: [],
      // member_count: 1,
      // version: 1668028225734,
      /**
       * FIXME: Discord seems to be reorganizing the way that Guild properties work
       * for the Discord client. Thankfully, this seems to only affect the
       * gateway "READY" event.
      */
      // properties: {},
    };
  },
};

export const PartialGuild: QuarkConversion<revoltPartialServer, DiscordPartialGuild> = {
  async to_quark(data) {
    const {
      id, name, icon, features,
    } = data;

    return {
      _id: id,
      name,
      owner: "0",
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

    const iconId = icon ? await uploadBase64File("icons", {
      file: icon,
    }, "image/png") : null;
    const bannerId = banner ? await uploadBase64File("banners", {
      file: banner,
    }, "image/png") : null;

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
    const { name, description } = data;

    return {
      name: name ?? undefined,
      description,
    };
  },
};
