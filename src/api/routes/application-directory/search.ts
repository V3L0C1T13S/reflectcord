/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { genLoadId, HTTPError } from "@reflectcord/common/utils";
import { getRevoltDiscoveryDataURL } from "@reflectcord/common/constants";
import axios from "axios";
import { BotDiscoveryResponse } from "@reflectcord/common/rvapi";
import { DiscoverableBot } from "@reflectcord/common/models";

export default () => <Resource> {
  get: async (req, res) => {
    const { query, guild_id } = req.query;

    if (!query) throw new HTTPError("Please provide a query.");

    const discoveryURL = await getRevoltDiscoveryDataURL();
    const botResponse = await axios
      .get<BotDiscoveryResponse>(`${discoveryURL}/discover/search.json?query=${query}&type=bots`);
    const { data } = botResponse;
    const revoltBots = data.pageProps.bots;

    res.json({
      results: await Promise.all(revoltBots.map(async (x) => ({
        type: 1,
        data: await DiscoverableBot.from_quark(x),
      }))),
      num_pages: 1,
      counts_by_category: {
        1: 1,
      },
      result_count: revoltBots.length,
      type: 1,
      load_id: `app_directory_service/${genLoadId(16)}`,
    });
  },
};
