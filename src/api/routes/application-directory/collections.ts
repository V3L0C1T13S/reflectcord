import { Response } from "express";
import { Resource } from "express-automatic-routes";
import axios from "axios";
import { DiscoverableBot, PartialFile } from "@reflectcord/common/models";
import { AppCategory, CollectionType } from "@reflectcord/common/sparkle";
import { getRevoltDiscoveryDataURL } from "@reflectcord/common/constants";
import { BotDiscoveryResponse } from "@reflectcord/common/rvapi";
import { startCase } from "lodash";

export default () => <Resource> {
  get: async (req, res: Response<AppCategory[]>) => {
    const discoveryURL = await getRevoltDiscoveryDataURL();
    const botResponse = await axios.get<BotDiscoveryResponse>(`${discoveryURL}/discover/bots.json`);
    const revoltBots = botResponse.data;

    const mostPopularBot = revoltBots.pageProps.bots[0];

    const categories = [];

    if (mostPopularBot) {
      const application = await DiscoverableBot.from_quark(mostPopularBot);
      categories.push({
        id: "0",
        active: true,
        type: CollectionType.Featured,
        position: 0,
        title: mostPopularBot.username,
        description: mostPopularBot.profile?.content ?? "fixme",
        application_directory_collection_items: [{
          id: "0",
          type: 1,
          image_hash: mostPopularBot.profile?.background
            ? await PartialFile.from_quark(mostPopularBot.profile.background)
            : "",
          position: 1,
          application,
        }],
      });
    }

    categories.push({
      id: "0",
      active: true,
      type: CollectionType.Promoted,
      position: 0,
      title: "Discover bots on Revolt",
      description: "Discover bots on Revolt",
      application_directory_collection_items: await Promise.all(revoltBots.pageProps.bots
        .splice(1, 3)
        .map(async (app, pos) => ({
          id: "0",
          type: 1,
          image_hash: app.profile?.background
            ? await PartialFile.from_quark(app.profile.background)
            : "",
          position: pos,
          application: await DiscoverableBot.from_quark(app),
        }))),
    }, ...await Promise.all(revoltBots.pageProps.popularTags
      .map(async (name, i) => ({
        id: "0",
        active: true,
        type: CollectionType.Category,
        position: i,
        title: startCase(name),
        description: `Bots categorized by ${name}`,
        application_directory_collection_items: await Promise.all(revoltBots
          .pageProps.bots
          .filter((app) => app.tags.includes(name))
          .map(async (app, pos) => ({
            id: "0",
            type: 1,
            image_hash: "",
            position: pos,
            application: await DiscoverableBot.from_quark(app),
          }))),
      }))));

    res.json(categories);
  },
};
