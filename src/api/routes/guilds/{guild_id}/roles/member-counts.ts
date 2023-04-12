/* eslint-disable camelcase */
import { Response } from "express";
import { Resource } from "express-automatic-routes";
import { MemberCountsResponse } from "@reflectcord/common/sparkle";
import { HTTPError, UnimplementedError } from "@reflectcord/common/utils";
import { fromSnowflake, toSnowflake } from "@reflectcord/common/models";
import { enableRoleMemberCounts } from "@reflectcord/common/constants";

export default () => <Resource> {
  // FIXME: 429 hell yet again
  get: async (req, res: Response<MemberCountsResponse>) => {
    if (!enableRoleMemberCounts) throw new UnimplementedError();
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    const rvServerId = await fromSnowflake(guild_id);

    const server = await res.rvAPIWrapper.servers.fetch(rvServerId);
    const members = await server.extra?.members.fetchMembers(rvServerId, true);
    if (!members) throw new HTTPError("RVAPI bug: did not receive extra object", 500);

    const guild = server.discord;
    const { roles } = guild;

    const roleCounts: MemberCountsResponse = {};

    roles.forEach((x) => {
      roleCounts[x.id] = 0;
    });

    await Promise.all(members.members.map(async (member) => {
      if (member.roles) {
        await Promise.all(member.roles.map(async (x) => {
          roleCounts[await toSnowflake(x)] += 1;
        }));
      }
    }));

    res.json(roleCounts);
  },
};
