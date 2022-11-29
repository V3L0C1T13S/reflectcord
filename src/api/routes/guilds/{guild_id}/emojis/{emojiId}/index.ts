/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { Emoji, tryFromSnowflake } from "@reflectcord/common/models";

export default () => <Resource> {
  get: async (req, res) => {
    const { emojiId, guild_id } = req.params;

    if (!emojiId || !guild_id) throw new HTTPError("Invalid params");

    const rvEmoji = await res.rvAPI.get(`/custom/emoji/${await tryFromSnowflake(emojiId) as ""}`);

    res.json(await Emoji.from_quark(rvEmoji));
  },
  delete: async (req, res) => {
    const { emojiId, guild_id } = req.params;

    if (!emojiId || !guild_id) throw new HTTPError("Invalid params");

    await res.rvAPI.delete(`/custom/emoji/${await tryFromSnowflake(emojiId)}`);

    res.sendStatus(204);
  },
  // FIXME
  patch: (req, res) => {
    res.sendStatus(500);
  },
};
