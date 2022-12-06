/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { genLoadId, HTTPError } from "@reflectcord/common/utils";
import { getRevoltDiscoveryDataURL } from "@reflectcord/common/constants";
import axios from "axios";
import { BotDiscoveryResponse } from "@reflectcord/common/rvapi";
import { DiscoverableBot } from "@reflectcord/common/models";

export default () => <Resource> {
  get: async (req, res) => {
    const { query, guild_id, category_id } = req.query;

    const discoveryURL = await getRevoltDiscoveryDataURL();
    const botResponse = await axios
      .get<BotDiscoveryResponse>(`${discoveryURL}/discover/${query?.length && query.length > 0 ? `search.json?query=${query}&type=bots` : "bots.json"}`);
    const { data } = botResponse;
    const revoltBots = data.pageProps.bots;

    const countsByCategory: Record<number, number> = {
      0: revoltBots.length,
    };

    const categoryId = typeof category_id === "string" ? parseInt(category_id, 10) : null;
    const categoryName = categoryId && categoryId !== 0
      ? data.pageProps.popularTags[categoryId - 1] : null;
    if (!categoryName && categoryId) throw new HTTPError("Invalid category ID");

    data.pageProps.popularTags.forEach((x, i) => {
      countsByCategory[i + 1] = revoltBots.filter((y) => y.tags.includes(x)).length;
    });

    const results = await Promise.all(revoltBots
      .filter((x) => (categoryName ? x.tags?.includes(categoryName) : true))
      .map(async (x) => ({
        type: 1,
        data: await DiscoverableBot.from_quark(x),
      })));

    res.json({
      results,
      num_pages: 1,
      counts_by_category: countsByCategory,
      result_count: results.length,
      type: 1,
      load_id: `app_directory_service/${genLoadId(16)}`,
    });
  },
};
