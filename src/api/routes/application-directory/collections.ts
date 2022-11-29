/* eslint-disable no-return-assign */
import { Response } from "express";
import { Resource } from "express-automatic-routes";
import axios from "axios";
import { DiscoverableBot } from "@reflectcord/common/models";
import { AppCategory } from "@reflectcord/common/sparkle";
import { getRevoltDiscoveryDataURL } from "@reflectcord/common/constants";
import { BotDiscoveryResponse } from "@reflectcord/common/rvapi";

export default () => <Resource> {
  get: async (req, res: Response<AppCategory[]>) => {
    const discoveryURL = await getRevoltDiscoveryDataURL();
    const botResponse = await axios.get<BotDiscoveryResponse>(`${discoveryURL}/discover/bots.json`);
    const revoltBots = botResponse.data;

    const categories = await Promise.all(revoltBots.pageProps.popularTags
      .map(async (name, i) => ({
        id: "0",
        active: true,
        type: 1,
        position: i,
        title: name,
        description: `Bots categorized by ${name}`,
        application_directory_collection_items: await Promise.all(revoltBots
          .pageProps.bots
          .filter((app) => app.tags.includes(name))
          .map(async (app) => ({
            id: "0",
            type: 1,
            image_hash: "",
            position: 1,
            application: await DiscoverableBot.from_quark(app),
          }))),
      })));

    res.json(categories);
  },
};
