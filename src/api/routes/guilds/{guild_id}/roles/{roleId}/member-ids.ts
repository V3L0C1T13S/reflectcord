import { Resource } from "express-automatic-routes";
import { Response } from "express";
import { fromSnowflake, multipleToSnowflake } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";
import { MemberIdsResponse } from "@reflectcord/common/sparkle";

export default () => <Resource> {
  // FIXME: 429 hell
  get: async (req, res: Response<MemberIdsResponse>) => {
    const [guildId, roleId] = [req.params.guild_id, req.params.roleId];

    if (!guildId || !roleId) throw new HTTPError("Invalid params");

    const rvServerId = await fromSnowflake(guildId);
    const rvRoleId = await fromSnowflake(roleId);

    const members = await res.rvAPIWrapper.members.fetchMembers(rvServerId, true);

    const membersWithRole = members.members.filter((x) => x.roles?.includes(rvRoleId));

    res.json(await multipleToSnowflake(membersWithRole.map((x) => x._id.user)));
  },
};
