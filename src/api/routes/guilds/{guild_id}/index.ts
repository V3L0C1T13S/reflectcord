/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { createAPI } from "../../../../common/rvapi";
import { Guild } from "../../../../common/models";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const { guild_id } = req.params;

    if (!guild_id) return res.sendStatus(504);

    const api = createAPI(req.token);

    const server = await api.get(`/servers/${guild_id}`).catch(() => {
      res.sendStatus(500);
    }) as API.Server;
    if (!server) return;

    return res.json(await Guild.from_quark(server));
  },
};
