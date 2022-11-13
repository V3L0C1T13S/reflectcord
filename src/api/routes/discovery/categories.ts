import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import axios from "axios";
import { ServerDiscoveryResponse } from "../../../common/rvapi";
import { getRevoltDiscoveryDataURL } from "../../../common/constants";
import { DiscoveryCategory } from "../../../common/sparkle";

export default (express: Application) => <Resource> {
  get: async (req, res: Response<DiscoveryCategory[]>) => {
    const discoveryURL = await getRevoltDiscoveryDataURL();
    const revoltServers = await axios.get<ServerDiscoveryResponse>(`${discoveryURL}/discover/servers.json`);

    res.json(revoltServers.data.pageProps.popularTags.map((x, i) => ({
      id: i,
      is_primary: false,
      name: x,
    })));
  },
};
