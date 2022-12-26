/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { fromSnowflake, Permissions, Role } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

export default () => <Resource> {
  // FIXME
  get: (req, res) => {},
  patch: async (req, res) => {
    const { guild_id, roleId } = req.params;

    if (!roleId || !guild_id) throw new HTTPError("Invalid params");

    const serverId = await fromSnowflake(guild_id);
    const rvRoleId = await fromSnowflake(roleId);

    const perms = await Permissions.to_quark(req.body.permissions);

    console.log(perms);

    const revoltResponse = await res.rvAPI.put(`/servers/${serverId as ""}/permissions/${rvRoleId as ""}`, {
      permissions: {
        allow: perms.a,
        deny: perms.d,
      },
    });

    // const role = Object.entries(revoltResponse.roles ?? {}).find(([id]) => id === roleId);

    // if (!role) throw new HTTPError("Revolt returned invalid response", 500);

    res.json({
      ...req.body,
      id: roleId,
    });
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
