/* eslint-disable camelcase */
import { APIGuild } from "discord.js";
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";

export default (express: Application) => <Resource> {
  get: async (req, res: Response<APIGuild[]>) => {
    const servers = await res.rvAPIWrapper.servers.getServers();

    res.json(servers.map((x) => x.discord));
  },
};
