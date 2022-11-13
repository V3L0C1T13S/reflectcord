import axios from "axios";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "../../../common/utils";
import { getRevoltDiscoveryDataURL } from "../../../common/constants";
import { ServerDiscoveryResponse } from "../../../common/rvapi";

export default () => <Resource> {
  get: async (req, res) => {
    const { term } = req.query;
    if (!term) throw new HTTPError("Invalid search query");

    const discoveryURL = await getRevoltDiscoveryDataURL();
    const searchResults = await axios.get<ServerDiscoveryResponse>(`${discoveryURL}/discover/search.json?query=${term}&type=servers`);

    if (searchResults.data.pageProps.servers.length > 0) {
      res.json({ valid: true });
    } else res.json({ valid: false });
  },
};
