/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { Member, fromSnowflake } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

export default () => <Resource> {
  get: async (req, res) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid guild id");

    const serverId = await fromSnowflake(guild_id);

    const members = await res.rvAPI.get(`/servers/${serverId as ""}/members`);

    res.json(await Promise.all(members.members
      .map((x) => Member.from_quark(x, members.users.find((u) => x._id.user === u._id)))));
  },
};
