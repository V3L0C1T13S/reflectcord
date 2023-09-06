/* eslint-disable camelcase */
import { GuildFeature } from "discord.js";
import { QuarkConversion } from "../../../models/QuarkConversion";
import { fromSnowflake, toSnowflake } from "../../../models/util";
import { DiscoveryServer, DiscoveryBot } from "../../../rvapi";
import { App, GuildDiscoveryInfo, FullDiscoveryBot } from "../../../sparkle";
import { getServerFeatures } from "../guilds";
import { UserProfile } from "../user";
import { stubFlags } from "../application";
import { PartialFile } from "../attachment";

export const DiscoverableGuild: QuarkConversion<DiscoveryServer, GuildDiscoveryInfo> = {
  async to_quark(data) {
    const {
      name, id, keywords, description, approximate_member_count,
    } = data;

    return {
      name,
      description,
      _id: id,
      tags: keywords,
      flags: 0,
      members: approximate_member_count,
      activity: "high",
    };
  },

  async from_quark(data) {
    const {
      name, description, tags, _id, icon, banner, members,
    } = data;

    const features = getServerFeatures({
      ...data,
      icon: null,
      owner: "0",
    });

    features.push(GuildFeature.InviteSplash, GuildFeature.Discoverable);

    const discordBanner = banner ? await PartialFile.from_quark(banner) : null;

    return {
      id: await toSnowflake(_id),
      name,
      description,
      keywords: tags,
      icon: icon ? await PartialFile.from_quark(icon) : null,
      splash: discordBanner,
      discovery_splash: discordBanner,
      banner: discordBanner,
      approximate_presence_count: 0,
      approximate_member_count: members,
      premium_subscription_count: 966,
      preferred_locale: "en-US",
      auto_removed: false,
      primary_category_id: 0,
      vanity_url_code: data._id,
      is_published: false,
      features,
    };
  },
};

export const DiscoverableBot: QuarkConversion<DiscoveryBot, App> = {
  async to_quark(app) {
    const {
      name, description, bot, tags,
    } = app;

    return {
      username: name,
      profile: {
        ...await UserProfile.to_quark({
          ...bot,
          bio: description,
          accent_color: null,
          banner: null,
          pronouns: "",
        }),
        content: description,
        background: null,
      },
      usage: "high",
      _id: await fromSnowflake(bot.id),
      avatar: null,
      tags: tags?.map((x) => x!) ?? [],
      servers: 0,
    };
  },

  async from_quark(app) {
    const { username, profile, _id } = app;

    const id = await toSnowflake(_id);

    const icon = app.avatar ? await PartialFile.from_quark(
      app.avatar,
      { skipConversion: true },
    ) : null;

    return {
      type: 1,
      id,
      hook: true,
      slug: username,
      description: profile?.content ?? "fixme",
      name: username,
      icon,
      bot_public: true,
      bot_require_code_grant: false,
      summary: "",
      verify_key: "",
      team: null,
      flags: stubFlags.bitfield.toInt(),
      position: 1,
      bot: {
        id,
        username,
        avatar: icon,
        discriminator: "1",
        public_flags: 0,
        bot: true,
      },
    };
  },
};

export const FullDiscoverableBot: QuarkConversion<DiscoveryBot, FullDiscoveryBot> = {
  async to_quark(data) {
    return DiscoverableBot.to_quark(data as any);
  },

  async from_quark(data) {
    const description = data.profile?.content ?? "fixme";

    return {
      ...await DiscoverableBot.from_quark(data),
      guild: null,
      categories: [],
      directory_entry: {
        guild_count: 0,
        detailed_description: description,
        popular_application_command_ids: [],
        carousel_items: [],
        short_description: description,
        supported_locales: [],
        popular_application_commands: [],
        external_urls: [],
      },
      tags: data.tags,
      install_params: {
        scopes: ["bot"],
        permissions: "0",
      },
    };
  },
};
