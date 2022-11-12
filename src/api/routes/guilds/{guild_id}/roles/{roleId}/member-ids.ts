import { Resource } from "express-automatic-routes";
import { Response } from "express";
import { fromSnowflake, toSnowflake } from "../../../../../../common/models/util";
import { HTTPError } from "../../../../../../common/utils";
import { MemberIdsResponse } from "../../../../../../common/sparkle";

export default () => <Resource> {
  // FIXME: 429 hell
  get: async (req, res: Response<MemberIdsResponse>) => {
    const [guildId, roleId] = [req.params.guild_id, req.params.roleId];

    if (!guildId || !roleId) throw new HTTPError("Invalid params");

    const rvServerId = await fromSnowflake(guildId);
    const rvRoleId = await fromSnowflake(roleId);

    const members = await res.rvAPIWrapper.members.fetchMembers(rvServerId, true);

    const membersWithRole = members.members.filter((x) => x.roles?.includes(rvRoleId));

    res.json(await Promise.all(membersWithRole.map((x) => toSnowflake(x._id.user))));
  },
};
