/* eslint-disable camelcase */
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { APIChannel } from "discord.js";
import { createAPI } from "../../../../common/rvapi";
import { Channel, Guild } from "../../../../common/models";

export default (express: Application) => <Resource> {
  get: async (req, res: Response<APIChannel[]>) => {
    const { guild_id } = req.params;

    if (!guild_id) return res.sendStatus(504);

    const api = createAPI(req.token);

    const rvGuild = await api.get(`/servers/${guild_id}`) as API.Server;
    const channels = await Promise.all(rvGuild.channels
      .map((channel) => api.get(`/channels/${channel}`))) as API.Channel[];

    return res.json(await Promise.all(channels
      .map((channel) => Channel.from_quark(channel))));
  },
};
