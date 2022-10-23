/* eslint-disable camelcase */
import { HTTPError } from "common/utils";
import { APIGuildCreateRole } from "discord.js";
import { Application, Request } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Role } from "../../../../../common/models";
import { fromSnowflake } from "../../../../../common/models/util";

export default (express: Application) => <Resource> {
  post: async (req: Request<any, any, APIGuildCreateRole>, res) => {
    const {
      name, permissions, color, hoist, icon, unicode_emoji, mentionable,
    } = req.body;

    const { guild_id } = req.params;

    const serverId = await fromSnowflake(guild_id);

    const role = await res.rvAPI.post(`/servers/${serverId}/roles`, {
      name: name ?? "new role",
    }) as API.NewRoleResponse;

    res.json(await Role.from_quark(role.role));
  },
};
