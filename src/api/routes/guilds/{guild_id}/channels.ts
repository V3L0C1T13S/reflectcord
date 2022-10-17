/* eslint-disable camelcase */
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { APIChannel } from "discord.js";
import { Channel } from "../../../../common/models";
import { fromSnowflake } from "../../../../common/models/util";

export default (express: Application) => <Resource> {
  get: async (req, res: Response<APIChannel[]>) => {
    const { guild_id } = req.params;

    if (!guild_id) return res.sendStatus(504);

    const rvId = await fromSnowflake(guild_id);

    const api = res.rvAPI;

    const rvGuild = await api.get(`/servers/${rvId}`) as API.Server;
    const channels = await Promise.all(rvGuild.channels
      .map((channel) => api.get(`/channels/${channel}`))) as API.Channel[];

    return res.json(await Promise.all(channels
      .map((channel) => Channel.from_quark(channel))));
  },
};
