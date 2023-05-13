/* eslint-disable camelcase */
import { fromSnowflake } from "@reflectcord/common/models";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";

export default () => <Resource> {
  get: async (req, res) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    const rvId = await fromSnowflake(guild_id);

    const emojis = await res.rvAPIWrapper.servers.getChannelNameEmojis(rvId, "id");

    res.json(emojis);
  },
};
