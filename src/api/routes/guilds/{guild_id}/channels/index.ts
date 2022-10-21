/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { HTTPError } from "../../../../../common/utils";
import { fromSnowflake, toSnowflake } from "../../../../../common/models/util";
import { Channel } from "../../../../../common/models";

export default (express: Application) => <Resource> {
  post: async (req, res) => {
    const { name } = req.body;
    const { guild_id } = req.params;

    if (!guild_id || !name) throw new HTTPError("Invalid params");

    const rvId = await fromSnowflake(guild_id);

    const rvChannel = await res.rvAPI.post(`/servers/${rvId}/channels`, {
      name,
    }) as API.Channel;

    res.status(201).json(await Channel.from_quark(rvChannel));
  },
};
