/* eslint-disable camelcase */
import { GetDetectableApps } from "@reflectcord/common/utils";
import { Application } from "express";
import { Resource } from "express-automatic-routes";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const apps = await GetDetectableApps();

    res.json(apps.rawAppData);
  },
};
