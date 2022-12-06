import { Resource } from "express-automatic-routes";
import { getRevoltDiscoveryDataURL } from "@reflectcord/common/constants";
import axios from "axios";
import { BotDiscoveryResponse } from "@reflectcord/common/rvapi";
import { fromSnowflake, DiscoverableBot } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

// FIXME
export default () => <Resource> {
  get: async (req, res) => {
    const { appId } = req.params;
    if (!appId) throw new HTTPError("Invalid appid");

    const rvAppId = await fromSnowflake(appId);

    const discoveryURL = await getRevoltDiscoveryDataURL();
    const botResponse = await axios.get<BotDiscoveryResponse>(`${discoveryURL}/discover/bots.json`);
    const revoltBots = botResponse.data;

    const bot = revoltBots.pageProps.bots.find((x) => x._id === rvAppId);
    if (!bot) throw new HTTPError("Couldn't find bot.");

    const similarBots = revoltBots.pageProps.bots
      .filter((x) => x.tags.some((tag) => bot.tags.includes(tag)));

    res.json(await Promise.all(similarBots.map((x) => DiscoverableBot.from_quark(x))));
  },
};
