/* eslint-disable camelcase */
import { Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { RESTPatchAPIGuildMemberJSONBody } from "discord.js";
import { Member } from "../../../../../../common/models";
import { fromSnowflake } from "../../../../../../common/models/util";
import { HTTPError } from "../../../../../../common/utils";

export async function handleMemberEdit(req: Request, res: Response, fullMember: boolean) {
  const { guild_id, memberId } = req.params;
  if (!guild_id || !memberId) throw new HTTPError("Invalid params");

  const { nick, roles, communication_disabled_until } = req.body as RESTPatchAPIGuildMemberJSONBody;

  const serverId = await fromSnowflake(guild_id);
  const rvMemberId = await fromSnowflake(memberId);

  const toRemove: API.FieldsMember[] = [];

  if (nick === "") toRemove.push("Nickname");

  const member = await res.rvAPI.patch(`/servers/${serverId as ""}/members/${rvMemberId as ""}`, {
    nickname: nick || null,
    roles: roles ? await Promise.all(roles.map((x) => fromSnowflake(x))) : null,
    remove: toRemove,
    timeout: communication_disabled_until ?? null,
  });

  if (fullMember) res.json(await Member.from_quark(member));
  else res.sendStatus(200);
}

export default () => <Resource> {
  patch: async (req, res) => {
    await handleMemberEdit(req, res, false);
  },
};
