/* eslint-disable no-bitwise */
import axios from "axios";
import { Response } from "express";
import { Resource } from "express-automatic-routes";
import { DiscoverableGuild } from "../../../common/models";
import { ServerDiscoveryResponse } from "../../../common/rvapi";
import { getRevoltDiscoveryDataURL } from "../../../common/constants";
import { GuildDiscoveryRequest } from "../../../common/sparkle";

export default () => <Resource> {
  get: async (req, res: Response<GuildDiscoveryRequest>) => {
    const discoveryURL = await getRevoltDiscoveryDataURL();
    const revoltServers = await axios.get<ServerDiscoveryResponse>(`${discoveryURL}/discover/servers.json`);

    res.json({
      recommended_guilds: await Promise.all(revoltServers.data.pageProps.servers
        .map((x) => DiscoverableGuild.from_quark(x))),
      load_id: "server_recs/fixme",
    });
  },
};
