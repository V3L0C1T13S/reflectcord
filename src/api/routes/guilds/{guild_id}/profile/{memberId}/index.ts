/* eslint-disable camelcase */
import { RESTPatchAPIGuildMemberJSONBody } from "discord.js";
import { Request } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Member } from "../../../../../../common/models";
import { fromSnowflake } from "../../../../../../common/models/util";
import { HTTPError } from "../../../../../../common/utils";

type editMemberBody = RESTPatchAPIGuildMemberJSONBody & {
  banner?: string;
}

export default () => <Resource> {
  patch: async (req: Request<any, any, editMemberBody>, res) => {
    const { guild_id, memberId } = req.params;
    const { nick, roles } = req.body;

    if (!guild_id || !memberId) throw new HTTPError("Invalid params");

    const serverId = await fromSnowflake(guild_id);
    const rvMemberId = await fromSnowflake(memberId);

    const member = await res.rvAPI.patch(`/servers/${serverId}/members/${rvMemberId}`, {
      nickname: nick ?? null,
      roles: roles ?? null,
    }) as API.Member;

    res.json(await Member.from_quark(member));
  },
};
