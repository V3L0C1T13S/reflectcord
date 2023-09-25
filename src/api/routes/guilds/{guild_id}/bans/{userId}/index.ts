/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { Ban, fromSnowflake } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";
import { Request, Response } from "express";
import { APIBan, RESTPutAPIGuildBanJSONBody } from "discord.js";

export default () => <Resource> {
  get: async (req, res: Response<APIBan>) => {
    const { guild_id, userId } = req.params;
    if (!guild_id || !userId) throw new HTTPError("Invalid params");

    const rvServer = await fromSnowflake(guild_id);
    const rvUserId = await fromSnowflake(userId);

    const bans = await res.rvAPI.get(`/servers/${rvServer as ""}/bans`);

    const rvBan = bans.bans.find((x) => x._id.user === rvUserId);
    const user = bans.users.find((x) => x._id === rvUserId);

    if (!rvBan || !user) throw new HTTPError("Ban not found", 404);

    res.json(await Ban.from_quark(rvBan, {
      user,
    }));
  },
  put: async (req: Request<any, any, RESTPutAPIGuildBanJSONBody>, res: Response<APIBan>) => {
    const { guild_id, userId } = req.params;
    if (!guild_id || !userId) throw new HTTPError("Invalid params");

    const rvServer = await fromSnowflake(guild_id);
    const rvUserId = await fromSnowflake(userId);

    const rvBan = await res.rvAPI.put(`/servers/${rvServer as ""}/bans/${rvUserId as ""}`, {});

    res.json(await Ban.from_quark(rvBan));
  },
  delete: async (req, res) => {
    const { guild_id, userId } = req.params;
    if (!guild_id || !userId) throw new HTTPError("Invalid params");

    const rvServer = await fromSnowflake(guild_id);
    const rvUserId = await fromSnowflake(userId);

    await res.rvAPI.delete(`/servers/${rvServer}/bans/${rvUserId}`);

    res.sendStatus(204);
  },
};
