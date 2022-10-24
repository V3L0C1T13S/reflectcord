/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Emoji } from "../../../../../common/models";
import { HTTPError } from "../../../../../common/utils";
import { fromSnowflake } from "../../../../../common/models/util";

export default () => <Resource> {
  get: async (req, res) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    const serverId = await fromSnowflake(guild_id);

    const emojis = await res.rvAPI.get(`/servers/${serverId}/emojis`) as API.Emoji[];
    if (!Array.isArray(emojis)) throw new HTTPError("Failed to get emojis");

    res.json(await Promise.all(emojis.map((x) => Emoji.from_quark(x))));
  },
};
