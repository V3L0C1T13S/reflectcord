/* eslint-disable camelcase */
import { APIGuildCreateRole, APIRole } from "discord.js";
import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { Guild, Role, fromSnowflake } from "@reflectcord/common/models";

export default (express: Application) => <Resource> {
  get: async (req, res: Response<APIRole[]>) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    const serverId = await fromSnowflake(guild_id);

    const server = await res.rvAPI.get(`/servers/${serverId as ""}`);

    res.json((await Guild.from_quark(server)).roles);
  },
  post: async (req: Request<any, any, APIGuildCreateRole>, res) => {
    const {
      name, permissions, color, hoist, icon, unicode_emoji, mentionable,
    } = req.body;

    const { guild_id } = req.params;

    const serverId = await fromSnowflake(guild_id);

    const role = await res.rvAPI.post(`/servers/${serverId as ""}/roles`, {
      name: name ?? "new role",
    });

    res.json(await Role.from_quark(role.role));
  },
};
