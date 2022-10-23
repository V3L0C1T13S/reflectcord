/* eslint-disable camelcase */
import { Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { fromSnowflake } from "../../../../../../common/models/util";
import { HTTPError } from "../../../../../../common/utils";

export async function handleMemberEdit(req: Request, res: Response) {
  const { guild_id, memberId } = req.params;
  const { nick } = req.body;

  if (!guild_id || !memberId) throw new HTTPError("Invalid params");

  if (!nick) throw new HTTPError("Invalid nickname");

  const serverId = await fromSnowflake(guild_id);
  const rvMemberId = await fromSnowflake(memberId);

  await res.rvAPI.patch(`/servers/${serverId}/members/${rvMemberId}`, {
    nickname: nick,
  });

  res.sendStatus(200);
}

export default () => <Resource> {
  patch: handleMemberEdit,
};
