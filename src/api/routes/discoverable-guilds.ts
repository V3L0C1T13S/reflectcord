import axios from "axios";
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { getRevoltDiscoveryDataURL } from "../../common/constants";
import { ServerDiscoveryResponse } from "../../common/rvapi";
import { DiscoverableGuild } from "../../common/models";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const discoveryURL = await getRevoltDiscoveryDataURL();
    const revoltServers = await axios.get<ServerDiscoveryResponse>(`${discoveryURL}/discover/servers.json`);

    const total = revoltServers.data.pageProps.servers.length;
    res.json({
      total,
      guilds: await Promise.all(revoltServers.data.pageProps.servers
        .map((x) => DiscoverableGuild.from_quark(x))),
    });
  },
};
