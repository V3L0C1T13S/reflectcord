import { Response } from "express";
import { Resource } from "express-automatic-routes";
import { GeneralCategory } from "@reflectcord/common/sparkle";
import axios from "axios";
import { getRevoltDiscoveryDataURL } from "@reflectcord/common/constants";
import { BotDiscoveryResponse } from "@reflectcord/common/rvapi";
import { startCase } from "lodash";

export default () => <Resource> {
  get: async (req, res: Response<GeneralCategory[]>) => {
    const discoveryURL = await getRevoltDiscoveryDataURL();
    const botResponse = await axios.get<BotDiscoveryResponse>(`${discoveryURL}/discover/bots.json`);
    const revoltBots = botResponse.data;

    res.json(revoltBots.pageProps.popularTags.map((x, i) => ({
      id: i + 1,
      name: startCase(x),
    })));
  },
};
