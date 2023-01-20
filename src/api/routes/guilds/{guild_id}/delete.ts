/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { fromSnowflake } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

export default () => <Resource> {
  post: async (req, res) => {
    const { guild_id } = req.params;
    if (!guild_id) throw new HTTPError("Invalid params");

    const serverId = await fromSnowflake(guild_id);

    await res.rvAPIWrapper.servers.deleteServer(serverId);

    res.sendStatus(204);
  },
};
