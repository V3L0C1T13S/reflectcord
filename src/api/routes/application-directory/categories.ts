import { Resource } from "express-automatic-routes";
import { getRevoltDiscoveryDataURL } from "../../../common/constants";

export default () => <Resource> {
  get: async (req, res) => {
    const discoveryURL = await getRevoltDiscoveryDataURL();
  },
};
