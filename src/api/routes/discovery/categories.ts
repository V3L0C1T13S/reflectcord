import { Response } from "express";
import { Resource } from "express-automatic-routes";
import axios from "axios";
import { startCase } from "lodash";
import { ServerDiscoveryResponse } from "@reflectcord/common/rvapi";
import { getRevoltDiscoveryDataURL } from "@reflectcord/common/constants";
import { DiscoveryCategory } from "@reflectcord/common/sparkle";

export default () => <Resource> {
  get: async (req, res: Response<DiscoveryCategory[]>) => {
    const discoveryURL = await getRevoltDiscoveryDataURL();
    const revoltServers = await axios.get<ServerDiscoveryResponse>(`${discoveryURL}/discover/servers.json`);

    res.json(revoltServers.data.pageProps.popularTags.map((x, i) => ({
      id: i,
      is_primary: false,
      name: startCase(x),
    })));
  },
};
