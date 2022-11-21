/* eslint-disable camelcase */
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { APIChannel } from "discord.js";
import { HandleChannelsAndCategories, fromSnowflake } from "@reflectcord/common/models";

export default (express: Application) => <Resource> {
  get: async (req, res: Response<APIChannel[]>) => {
    const { guild_id } = req.params;

    if (!guild_id) return res.sendStatus(504);

    const rvId = await fromSnowflake(guild_id);

    const api = res.rvAPI;

    const rvGuild = await api.get(`/servers/${rvId as ""}`);
    const channels = await Promise.all(rvGuild.channels
      .map((channel) => api.get(`/channels/${channel as ""}`)));

    return res.json(await HandleChannelsAndCategories(channels, rvGuild.categories, rvId));
  },
};
