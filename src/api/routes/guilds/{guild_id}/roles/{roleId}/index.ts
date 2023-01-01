/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import {
  fromSnowflake, Permissions, Role, RoleEdit,
} from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";
import { API } from "revolt.js";
import { Response } from "express";
import { APIRole } from "discord.js";

export default () => <Resource> {
  get: async (req, res: Response<APIRole>) => {
    const { guild_id, roleId } = req.params;

    if (!roleId || !guild_id) throw new HTTPError("Invalid params");

    const serverId = await fromSnowflake(guild_id);

    const server = await res.rvAPIWrapper.servers.fetch(serverId);
    const role = server.discord.roles.find((x) => x.id === roleId);
    if (!role) throw new HTTPError("Role not found", 404);

    res.json(role);
  },
  patch: async (req, res: Response<APIRole>) => {
    const { guild_id, roleId } = req.params;

    if (!roleId || !guild_id) throw new HTTPError("Invalid params");

    const serverId = await fromSnowflake(guild_id);
    const rvRoleId = await fromSnowflake(roleId);

    const rvPatchbody = await RoleEdit.to_quark(req.body);

    const rvRole = await res.rvAPI.patch(`/servers/${serverId as ""}/roles/${rvRoleId as ""}`, rvPatchbody);

    if (req.body.permissions) {
      const perms = await Permissions.to_quark(req.body.permissions);

      const revoltResponse = await res.rvAPIWrapper.servers.editRolePerms(serverId, rvRoleId, {
        permissions: {
          allow: perms.a,
          deny: perms.d,
        },
      });

      const role = Object.entries(revoltResponse.roles ?? {}).find(([id]) => id === rvRoleId);

      if (!role) throw new HTTPError("Revolt returned invalid response", 500);

      rvRole.permissions = role[1].permissions;
    }

    res.json(await Role.from_quark(rvRole, rvRoleId));
  },
  delete: async (req, res) => {
    const { guild_id, roleId } = req.params;

    if (!roleId || !guild_id) throw new HTTPError("Invalid params");

    const serverId = await fromSnowflake(guild_id);
    const rvRoleId = await fromSnowflake(roleId);

    await res.rvAPI.delete(`/servers/${serverId as ""}/roles/${rvRoleId as ""}`);

    res.sendStatus(204);
  },
};
