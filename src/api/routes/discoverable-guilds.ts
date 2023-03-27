/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { DiscoveryClient } from "@reflectcord/common/rvapi";
import { DiscoverableGuild } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

const client = new DiscoveryClient();

export default () => <Resource> {
  get: async (req, res) => {
    await client.init();

    const { categories, guild_ids } = req.query as { categories: string, guild_ids: string[] };

    const revoltData = await client.servers.fetchPopular();
    let revoltServers = revoltData.pageProps.servers;

    if (categories) {
      const categoryNumber = parseInt(categories, 10);
      const categoryName = revoltData.pageProps.popularTags?.[categoryNumber] ?? "FIXME_NO_CATEGORY";

      if (!categoryName) throw new HTTPError("Invalid category ID");

      const filteredServers = revoltServers
        .filter((x) => x.tags.includes(categoryName));

      revoltServers = filteredServers;
    }

    let guilds = await Promise.all(revoltServers
      .map((x) => DiscoverableGuild.from_quark(x)));

    if (guild_ids) guilds = guilds.filter((x) => guild_ids.includes(x.id));

    res.json({
      total: guilds.length,
      guilds,
    });
  },
};
