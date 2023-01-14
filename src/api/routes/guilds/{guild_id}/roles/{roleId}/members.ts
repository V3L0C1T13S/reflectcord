/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { fromSnowflake } from "@reflectcord/common/models";
import { HTTPError, validate } from "@reflectcord/common/utils";
import { APIGuildRoleMembersPATCHBody } from "@reflectcord/common/sparkle";

export default () => <Resource> {
  patch: {
    middleware: validate(APIGuildRoleMembersPATCHBody),
    handler: async (req, res) => {
      const { guild_id, roleId } = req.params;
      const { member_ids } = req.body as { member_ids: string[] };

      if (!guild_id || !roleId) throw new HTTPError("Invalid params");

      const serverId = await fromSnowflake(guild_id);
      const rvRoleId = await fromSnowflake(roleId);

      await Promise.all(member_ids
        .map(async (member) => res.rvAPIWrapper.servers
          .addRoleToMember(serverId, await fromSnowflake(member), rvRoleId)));

      res.sendStatus(204);
    },
  },
  // TODO: Fosscord extension
  put: async (req, res) => {
    res.sendStatus(404);
  },
};
