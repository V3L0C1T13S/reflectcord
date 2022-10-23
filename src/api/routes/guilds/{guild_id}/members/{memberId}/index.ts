/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Member } from "../../../../../../common/models";
import { HTTPError } from "../../../../../../common/utils";
import { fromSnowflake } from "../../../../../../common/models/util";
import { handleMemberEdit } from "./nick";

export default () => <Resource> {
  get: async (req, res) => {
    const { guild_id, memberId } = req.params;

    if (!guild_id || !memberId) throw new HTTPError("Invalid params");

    const serverId = await fromSnowflake(guild_id);
    const rvMemberId = await fromSnowflake(memberId);

    const member = await res.rvAPI.get(`/servers/${serverId}/members/${rvMemberId}`) as API.Member;

    res.json(await Member.from_quark(member));
  },
  patch: handleMemberEdit,
};
