/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { InviteFull } from "../../../../common/models/models/invite";
import { fromSnowflake } from "../../../../common/models/util";
import { HTTPError } from "../../../../common/utils";

export default () => <Resource> {
  get: async (req, res) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params", 422);

    const serverId = await fromSnowflake(guild_id);

    const rvInvites = await res.rvAPI.get(`/servers/${serverId}/invites`) as API.InviteResponse[];

    res.json(await Promise.all(rvInvites.map((x) => InviteFull.from_quark(x))));
  },
};
