/* eslint-disable camelcase */
import { APIBan } from "discord.js";
import { Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Ban } from "../../../../common/models";
import { fromSnowflake } from "../../../../common/models/util";
import { HTTPError } from "../../../../common/utils";

export default () => <Resource> {
  get: async (req, res: Response<APIBan[]>) => {
    const { guild_id } = req.params;
    if (!guild_id) throw new HTTPError("Invalid params");

    const rvId = await fromSnowflake(guild_id);

    const bans = await res.rvAPI.get(`/servers/${rvId}/bans`) as API.BanListResult;

    res.json(await Promise.all(bans.bans.map((x) => Ban.from_quark(x))));
  },
};
