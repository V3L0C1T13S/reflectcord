/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { fromSnowflake } from "@reflectcord/common/models/util";
import { Guild } from "@reflectcord/common/models";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const { guild_id } = req.params;

    if (!guild_id) return res.sendStatus(244);

    const rvId = await fromSnowflake(guild_id);

    const api = res.rvAPI;

    const server = await api.get(`/servers/${rvId}`) as API.Server;

    return res.json(await Guild.from_quark(server));
  },
  delete: (req, res) => {
    // Don't implement. This is VERY dangerous ATM.
    res.sendStatus(500);
  },
};
