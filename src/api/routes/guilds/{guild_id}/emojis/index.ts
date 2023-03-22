/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { handleFile } from "../../../../../cdn/util";
import { Emoji } from "../../../../../common/models";
import { HTTPError } from "../../../../../common/utils";
import { fromSnowflake } from "../../../../../common/models/util";

export default () => <Resource> {
  get: async (req, res) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    const serverId = await fromSnowflake(guild_id);

    const emojis = await res.rvAPI.get(`/servers/${serverId as ""}/emojis`);
    if (!Array.isArray(emojis)) throw new HTTPError("Failed to get emojis");

    res.json(await Promise.all(emojis.map(async (x) => {
      const user = await res.rvAPIWrapper.users.fetch(x.creator_id);
      const emoji = await Emoji.from_quark(x, { discordUser: user.discord });

      return emoji;
    })));
  },
  post: async (req, res) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    const serverId = await fromSnowflake(guild_id);

    const fileId = await handleFile("emojis", req.body.image);

    const emoji = await res.rvAPI.put(`/custom/emoji/${fileId as ""}`, {
      name: req.body.name ?? "emoji",
      parent: {
        type: "Server",
        id: serverId,
      },
    });

    res.json(await Emoji.from_quark(emoji));
  },
};
