/* eslint-disable camelcase */
import { UserSettings } from "@reflectcord/common/sparkle";
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";

// FIXME
export default (express: Application) => <Resource> {
  patch: (req, res: Response<UserSettings>) => {
    res.sendStatus(204);
  },
};
