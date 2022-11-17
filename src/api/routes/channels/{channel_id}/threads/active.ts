import { RESTGetAPIGuildThreadsResult } from "discord.js";
import { Response } from "express";
import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res: Response<RESTGetAPIGuildThreadsResult>) => {
    res.json({
      threads: [],
      members: [],
    });
  },
};
