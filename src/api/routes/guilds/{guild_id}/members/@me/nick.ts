/* eslint-disable camelcase */
import { Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { RESTPatchAPIGuildMemberJSONBody } from "discord.js";
import { Member, MemberEditBody } from "../../../../../../common/models";
import { fromSnowflake } from "../../../../../../common/models/util";
import { HTTPError } from "../../../../../../common/utils";

export async function handleMemberEdit(req: Request, res: Response, fullMember: boolean) {
  const { guild_id, memberId } = req.params;
  if (!guild_id || !memberId) throw new HTTPError("Invalid params");

  const body = req.body as RESTPatchAPIGuildMemberJSONBody;

  const serverId = await fromSnowflake(guild_id);
  const rvMemberId = memberId !== "@me"
    ? await fromSnowflake(memberId)
    : await res.rvAPIWrapper.users.getSelfId();

  const member = await res.rvAPI.patch(
    `/servers/${serverId as ""}/members/${rvMemberId as ""}`,
    await MemberEditBody.to_quark(body),
  );

  if (fullMember) res.json(await Member.from_quark(member));
  else res.sendStatus(200);
}

export default () => <Resource> {
  patch: async (req, res) => {
    await handleMemberEdit(req, res, false);
  },
};
