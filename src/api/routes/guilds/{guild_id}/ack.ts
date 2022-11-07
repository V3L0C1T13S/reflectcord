/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { fromSnowflake } from "../../../../common/models/util";
import { HTTPError } from "../../../../common/utils";

export default () => <Resource> {
  post: async (req, res) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    const serverId = await fromSnowflake(guild_id);

    await res.rvAPI.put(`/servers/${serverId as ""}/ack`);

    res.sendStatus(204);
  },
};
