/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { HTTPError } from "../../../../../../common/utils";
import { Emoji } from "../../../../../../common/models";

export default () => <Resource> {
  get: async (req, res) => {
    const { emojiId, guild_id } = req.params;

    if (!emojiId || !guild_id) throw new HTTPError("Invalid params");

    const rvEmoji = await res.rvAPI.get(`/custom/emoji/${emojiId as ""}`);

    res.json(await Emoji.from_quark(rvEmoji));
  },
  delete: async (req, res) => {
    const { emojiId, guild_id } = req.params;

    if (!emojiId || !guild_id) throw new HTTPError("Invalid params");

    await res.rvAPI.delete(`/custom/emoji/${emojiId}`);

    res.sendStatus(204);
  },
};
