/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { fromSnowflake } from "../../../../../../common/models/util";
import { HTTPError } from "../../../../../../common/utils";

export default () => <Resource> {
  delete: async (req, res) => {
    const { guild_id, userId } = req.params;
    if (!guild_id || !userId) throw new HTTPError("Invalid params");

    const rvServer = await fromSnowflake(guild_id);
    const rvUserId = await fromSnowflake(userId);

    await res.rvAPI.delete(`/servers/${rvServer}/bans/${rvUserId}`);

    res.sendStatus(204);
  },
};
