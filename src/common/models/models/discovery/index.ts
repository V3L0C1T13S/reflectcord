/* eslint-disable camelcase */
import { GuildFeature } from "discord.js";
import { QuarkConversion } from "../../../models/QuarkConversion";
import { toSnowflake } from "../../../models/util";
import { DiscoveryServer } from "../../../rvapi";
import { GuildDiscoveryInfo } from "../../../sparkle";
import { getServerFeatures } from "../guilds";

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

    return {
      id: await toSnowflake(_id),
      name,
      description,
      keywords: tags,
      icon: icon?._id ?? "",
      splash: banner?._id ?? "",
      discovery_splash: banner?._id ?? "",
      banner: banner?._id ?? "",
      approximate_presence_count: 0,
      approximate_member_count: members,
      premium_subscription_count: 966,
      preferred_locale: "en-US",
      auto_removed: false,
      primary_category_id: 0,
      vanity_url_code: "fixme",
      is_published: false,
      features,
    };
  },
};
