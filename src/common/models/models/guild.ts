import {
  APIGuild, GuildDefaultMessageNotifications, GuildExplicitContentFilter, GuildMFALevel, GuildNSFWLevel, GuildPremiumTier, GuildSystemChannelFlags, GuildVerificationLevel,
} from "discord.js";
import { Server } from "revolt-api";
import { QuarkConversion } from "../QuarkConversion";

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
      _id, name, owner, description,
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
      icon_hash: null,
      icon: null,
      splash: null,
    };
  },
};
