/* eslint-disable camelcase */
import { Response } from "express";
import { Resource } from "express-automatic-routes";
import { MemberCountsResponse } from "@reflectcord/common/sparkle";
import { HTTPError } from "@reflectcord/common/utils";
import { fromSnowflake, Guild, toSnowflake } from "@reflectcord/common/models";
import { enableRoleMemberCounts } from "@reflectcord/common/constants";

export default () => <Resource> {
  // FIXME: 429 hell yet again
  get: async (req, res: Response<MemberCountsResponse>) => {
    if (!enableRoleMemberCounts) throw new HTTPError("Unimplemented", 500);
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    const rvServerId = await fromSnowflake(guild_id);

    const server = await res.rvAPI.get(`/servers/${rvServerId as ""}`);
    const members = await res.rvAPIWrapper.members.fetchMembers(rvServerId, true);

    const guild = await Guild.from_quark(server);
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
