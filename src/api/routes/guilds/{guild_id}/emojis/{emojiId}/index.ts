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
  patch: async (req, res) => {
    const { emojiId, guild_id } = req.params;

    if (!emojiId || !guild_id) throw new HTTPError("Invalid params");

    // Requires patch from https://github.com/V3L0C1T13S/revolt-backend
    // Will be merged with official instance once it's stable
    // @ts-ignore
    const emoji = await res.rvAPI.patch(`/custom/emoji/${await tryFromSnowflake(emojiId)}`, {
      name: req.body.name,
    });

    res.sendStatus(204);
  },
};
