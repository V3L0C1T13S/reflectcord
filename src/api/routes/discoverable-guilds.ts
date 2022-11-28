import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { DiscoveryClient } from "@reflectcord/common/rvapi";
import { DiscoverableGuild } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

const client = new DiscoveryClient();

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const { categories } = req.query as { categories: string };

    const revoltData = await client.servers.fetchPopular();
    let revoltServers = revoltData.pageProps.servers;

    if (categories) {
      const categoryNumber = parseInt(categories, 10);
      const categoryName = revoltData.pageProps.popularTags[categoryNumber];

      if (!categoryName) throw new HTTPError("Invalid category ID");

      const filteredServers = revoltServers
        .filter((x) => x.tags.includes(categoryName));

      revoltServers = filteredServers;
    }

    const total = revoltServers.length;
    res.json({
      total,
      guilds: await Promise.all(revoltServers
        .map((x) => DiscoverableGuild.from_quark(x))),
    });
  },
};
