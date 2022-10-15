import {
  APIGuild,
  GuildDefaultMessageNotifications,
  GuildExplicitContentFilter,
  GuildMFALevel,
  GuildNSFWLevel,
  GuildPremiumTier,
  GuildSystemChannelFlags,
  GuildVerificationLevel,
} from "discord.js";
import { Server } from "revolt-api";
import { QuarkConversion } from "../QuarkConversion";
import { Channel } from "./channel";

export type DiscordPartialGuild = {
  id: string,
  name: string,
  icon: string | null,
  owner: boolean,
  permissions: string,
  features: [],
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

    return {
      id: _id,
      name,
      owner_id: owner,
      description: description ?? null,
      region: "0",
      afk_channel_id: null,
      afk_timeout: 3600,
      widget_enabled: false,
      widget_channel_id: null,
      verification_level: GuildVerificationLevel.None,
      default_message_notifications: GuildDefaultMessageNotifications.AllMessages,
      explicit_content_filter: GuildExplicitContentFilter.Disabled,
      roles: [],
      emojis: [],
      features: [],
      mfa_level: GuildMFALevel.None,
      application_id: null,
      system_channel_id: null,
      system_channel_flags: GuildSystemChannelFlags.SuppressGuildReminderNotifications,
      rules_channel_id: null,
      max_presences: null,
      max_members: 10000,
      vanity_url_code: null,
      banner: null,
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
    };
  },
};

export const PartialGuild: QuarkConversion<Server, DiscordPartialGuild> = {
  async to_quark(data) {
    const {
      id, name, icon, features,
    } = data;

    return {
      ...await Guild.to_quark({
        id,
        name,
        icon,
        owner_id: "",
        discovery_splash: null,
        afk_channel_id: null,
        region: "",
        afk_timeout: 9999,
        verification_level: GuildVerificationLevel.None,
        default_message_notifications: GuildDefaultMessageNotifications.AllMessages,
        explicit_content_filter: GuildExplicitContentFilter.Disabled,
        roles: [],
        emojis: [],
        features: [],
        mfa_level: GuildMFALevel.None,
        application_id: null,
        system_channel_id: null,
        system_channel_flags: GuildSystemChannelFlags.SuppressGuildReminderNotifications,
        rules_channel_id: null,
        vanity_url_code: null,
        description: null,
        banner: null,
        premium_tier: GuildPremiumTier.None,
        public_updates_channel_id: null,
        nsfw_level: GuildNSFWLevel.Default,
        preferred_locale: "en-US",
        stickers: [],
        premium_progress_bar_enabled: false,
        hub_type: null,
        splash: null,
      }),
    };
  },

  async from_quark(data) {
    const { _id, name, icon } = data;

    return {
      id: _id,
      name,
      icon: icon?._id ?? null,
      owner: false,
      permissions: "",
      features: [],
    };
  },
};
