/* eslint-disable no-bitwise */
import axios from "axios";
import { Response } from "express";
import { Resource } from "express-automatic-routes";
import { DiscoverableGuild } from "@reflectcord/common/models";
import { ServerDiscoveryResponse } from "@reflectcord/common/rvapi";
import { getRevoltDiscoveryDataURL } from "@reflectcord/common/constants";
import { GuildDiscoveryRequest } from "@reflectcord/common/sparkle";
import { genLoadId } from "@reflectcord/common/utils";

/**
 * This seems to be used in older clients but discoverable-guilds
 * is favored by newer (november 8th and above) clients.
*/
export default () => <Resource> {
  get: async (req, res: Response<GuildDiscoveryRequest>) => {
    const discoveryURL = await getRevoltDiscoveryDataURL();
    const revoltServers = await axios.get<ServerDiscoveryResponse>(`${discoveryURL}/discover/servers.json`);

    res.json({
      recommended_guilds: await Promise.all(revoltServers.data.pageProps.servers
        .map((x) => DiscoverableGuild.from_quark(x))),
      load_id: `server_recs/${genLoadId(32)}`,
    });
  },
};
