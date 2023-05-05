/* eslint-disable camelcase */
import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { fromSnowflake, Guild, GuildEditBody } from "@reflectcord/common/models";
import { APIGuild, RESTPatchAPIGuildJSONBody } from "discord.js";
import { HTTPError } from "@reflectcord/common/utils";

export default () => <Resource> {
  get: async (req, res: Response<APIGuild>) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    const rvId = await fromSnowflake(guild_id);

    const api = res.rvAPI;

    const server = await api.get(`/servers/${rvId as ""}`);

    res.json(await Guild.from_quark(server));
  },
  patch: async (req: Request<any, any, RESTPatchAPIGuildJSONBody>, res: Response<APIGuild>) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    const rvId = await fromSnowflake(guild_id);

    const rvServer = await res.rvAPI.patch(
      `/servers/${rvId as ""}`,
      await GuildEditBody.to_quark(req.body),
    );

    res.json(await Guild.from_quark(rvServer));
  },
  delete: (req, res) => {
    // Don't implement. This is VERY dangerous ATM.
    res.sendStatus(500);
  },
};
