/* eslint-disable camelcase */
import { RESTPatchAPIGuildMemberJSONBody } from "discord.js";
import { Request } from "express";
import { Resource } from "express-automatic-routes";
import { Member, fromSnowflake, multipleFromSnowflake } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

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

    const member = await res.rvAPI.patch(`/servers/${serverId as ""}/members/${rvMemberId as ""}`, {
      nickname: nick ?? null,
      roles: roles ? await multipleFromSnowflake(roles) : null,
    });

    res.json(await Member.from_quark(member));
  },
};
