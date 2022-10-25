/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { User } from "../../../../common/models";
import { fromSnowflake } from "../../../../common/models/util";
import { HTTPError } from "../../../../common/utils";

export default () => <Resource> {
  get: async (req, res) => {
    const { guild_id } = req.params;
    if (!guild_id) throw new HTTPError("Invalid params");

    const rvId = await fromSnowflake(guild_id);

    const bans = await res.rvAPI.get(`/servers/${rvId}/bans`) as API.BanListResult;

    res.json(await Promise.all(bans.bans.map(async (x) => ({
      reason: x.reason,
      user: await User.from_quark({
        _id: x._id.user,
        username: "fixme",
      }),
    }))));
  },
};
