/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { fromSnowflake, Guild } from "@reflectcord/common/models";
import { patchSelfMember } from "../../profile/@me";

// Public server join route
export default () => <Resource> {
  put: async (req, res) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    const rvId = await fromSnowflake(guild_id);

    const rvServer = await res.rvAPI.post(`/invites/${rvId as ""}`);

    res.json(await Guild.from_quark(rvServer.server));
  },
  patch: patchSelfMember,
};
