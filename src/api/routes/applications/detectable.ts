/* eslint-disable camelcase */
import { GetDetectableApps } from "@reflectcord/common/utils";
import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: async (req, res) => {
    const apps = await GetDetectableApps();

    res.json(apps.rawAppData);
  },
};
