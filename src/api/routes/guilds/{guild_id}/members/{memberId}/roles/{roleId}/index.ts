/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { multipleFromSnowflake } from "@reflectcord/common/models/util";

export default () => <Resource> {
  put: async (req, res) => {
    const { memberId, roleId, guild_id } = req.params;
    if (!memberId || !roleId || !guild_id) throw new HTTPError("Bad params");

    const [rvServerId, rvMember, rvRole] = await multipleFromSnowflake(
      [guild_id, memberId, roleId],
    );

    await res.rvAPIWrapper.servers.addRoleToMember(rvServerId!, rvMember!, rvRole!);

    res.sendStatus(204);
  },
  delete: async (req, res) => {
    const { memberId, roleId, guild_id } = req.params;
    if (!memberId || !roleId || !guild_id) throw new HTTPError("Bad params");

    const [rvServerId, rvMember, rvRole] = await multipleFromSnowflake(
      [guild_id, memberId, roleId],
    );

    await res.rvAPIWrapper.servers.removeRoleFromMember(rvServerId!, rvMember!, rvRole!);

    res.sendStatus(204);
  },
};
