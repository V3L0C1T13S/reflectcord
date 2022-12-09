/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { Member, fromSnowflake } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";
import { handleMemberEdit } from "../@me/nick";

export default () => <Resource> {
  get: async (req, res) => {
    const { guild_id, memberId } = req.params;

    if (!guild_id || !memberId) throw new HTTPError("Invalid params");

    const serverId = await fromSnowflake(guild_id);
    const rvMemberId = await fromSnowflake(memberId);

    const member = await res.rvAPI.get(`/servers/${serverId as ""}/members/${rvMemberId as ""}`);

    res.json(await Member.from_quark(member));
  },
  patch: async (req, res) => {
    await handleMemberEdit(req, res, true);
  },
  delete: async (req, res) => {
    const { guild_id, memberId } = req.params;

    if (!guild_id || !memberId) throw new HTTPError("Invalid params");

    const serverId = await fromSnowflake(guild_id);
    const rvMemberId = await fromSnowflake(memberId);

    await res.rvAPI.delete(`/servers/${serverId as ""}/members/${rvMemberId as ""}`);

    res.sendStatus(204);
  },
};
