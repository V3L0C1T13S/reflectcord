import { AppCategory } from "common/sparkle";
import { Response } from "express";
import { Resource } from "express-automatic-routes";
import { getRevoltDiscoveryDataURL } from "../../../common/constants";

export default () => <Resource> {
  get: async (req, res: Response<AppCategory[]>) => {
    const discoveryURL = await getRevoltDiscoveryDataURL();
  },
};
