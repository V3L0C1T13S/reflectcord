/* eslint-disable no-bitwise */
import axios from "axios";
import { Response } from "express";
import { Resource } from "express-automatic-routes";
import { GuildFeature } from "discord.js";
import { ServerDiscoveryResponse } from "../../../common/rvapi";
import { getRevoltDiscoveryDataURL } from "../../../common/constants";
import { GuildDiscoveryInfo, GuildDiscoveryRequest } from "../../../common/sparkle";
import { toSnowflake } from "../../../common/models/util";

export default () => <Resource> {
  get: async (req, res: Response<GuildDiscoveryRequest>) => {
    const discoveryURL = await getRevoltDiscoveryDataURL();
    const revoltServers = await axios.get<ServerDiscoveryResponse>(`${discoveryURL}/discover/servers.json`);

    res.json({
      recommended_guilds: await Promise.all(revoltServers.data.pageProps.servers.map(async (x) => {
        const features = [
          GuildFeature.AnimatedIcon,
          GuildFeature.Banner,
          GuildFeature.Discoverable,
          GuildFeature.InviteSplash,
        ];

        const guild: GuildDiscoveryInfo = {
          id: await toSnowflake(x._id),
          name: x.name,
          description: x.description,
          icon: x.icon?._id ?? "",
          splash: x.banner?._id ?? "",
          banner: x.banner?._id ?? "",
          approximate_presence_count: 0,
          approximate_member_count: x.members,
          premium_subscription_count: 0,
          preferred_locale: "en-US",
          auto_removed: false,
          primary_category_id: 0,
          vanity_url_code: "fixme",
          is_published: false,
          keywords: x.tags,
          features,
        };

        if (x.flags) {
          if (x.flags & 1) {
            features.push(GuildFeature.Partnered);
            features.push(GuildFeature.Verified);
          }
          if (x.flags & 2) features.push(GuildFeature.Verified);
        }

        return guild;
      })),
      load_id: "server_recs/fixme",
    });
  },
};
