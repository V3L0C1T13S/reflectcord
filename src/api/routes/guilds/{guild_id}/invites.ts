/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { fromSnowflake, InviteCreate } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

export default () => <Resource> {
  get: async (req, res) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params", 422);

    const serverId = await fromSnowflake(guild_id);

    const rvInvites = await res.rvAPI.get(`/servers/${serverId as ""}/invites`);

    res.json(await Promise.all(rvInvites.map((x) => InviteCreate.from_quark(x))));
  },
};
