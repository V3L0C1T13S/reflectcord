/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { fromSnowflake } from "../../../../../../common/models/util";
import { HTTPError } from "../../../../../../common/utils";

export default () => <Resource> {
  // FIXME
  get: (req, res) => {},
  // FIXME
  patch: (req, res) => {
    res.sendStatus(500);
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
