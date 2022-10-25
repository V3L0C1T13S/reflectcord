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
} from "discord.js";
import { Server } from "revolt-api";
import { Logger } from "../../utils";
import { QuarkConversion } from "../QuarkConversion";
import { toSnowflake } from "../util";
import { convertPermNumber, Permissions } from "./permissions";
import { Role } from "./role";

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

    return {
      _id: id,
      owner: ownerId,
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
      _id, name, owner, description, icon,
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
        const roleStub: APIRole[] = [];
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

        Logger.log(`everyone perms: ${everyoneStub.permissions}`);

        roleStub[0] = everyoneStub;

        const roles = server.roles ? await Promise.all(Object.entries(server.roles)
          .map(async ([k, x]) => ({
            ...await Role.from_quark(x),
            id: await toSnowflake(k),
          }))) : [];
        roles.forEach((x) => roleStub.push(x));

        return roleStub;
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
      stickers: [],
      premium_progress_bar_enabled: false,
      hub_type: null,
      discovery_splash: null,
      icon_hash: icon?._id ?? null,
      icon: icon?._id ?? null,
      splash: null,
      guild_scheduled_events: [],
      // @ts-ignore
      joined_at: Date.now().toString(),
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
