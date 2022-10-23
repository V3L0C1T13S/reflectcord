/* eslint-disable camelcase */
import { Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Member } from "../../../../../../common/models";
import { fromSnowflake } from "../../../../../../common/models/util";
import { HTTPError } from "../../../../../../common/utils";

export async function handleMemberEdit(req: Request, res: Response, fullMember: boolean) {
  const { guild_id, memberId } = req.params;
  const { nick } = req.body;

  if (!guild_id || !memberId) throw new HTTPError("Invalid params");

  const serverId = await fromSnowflake(guild_id);
  const rvMemberId = await fromSnowflake(memberId);

  const member = await res.rvAPI.patch(`/servers/${serverId}/members/${rvMemberId}`, {
    nickname: nick ?? null,
  }) as API.Member;

  if (fullMember) res.json(await Member.from_quark(member));
  else res.sendStatus(200);
}

export default () => <Resource> {
  patch: async (req, res) => {
    await handleMemberEdit(req, res, false);
  },
};
