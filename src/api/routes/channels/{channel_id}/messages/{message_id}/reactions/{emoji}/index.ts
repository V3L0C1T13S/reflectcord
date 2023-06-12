/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { HTTPError, REACTION_EXTRACT_ID } from "@reflectcord/common/utils";
import { fromSnowflake, tryFromSnowflake, User } from "@reflectcord/common/models";
import { emojis as emojisMap } from "@reflectcord/common/emojilib";

export default () => <Resource> {
  delete: async (req, res) => {
    const { channel_id, message_id, emoji } = req.params;

    if (!channel_id || !message_id || !emoji) throw new HTTPError("Invalid params");

    const channelId = await fromSnowflake(channel_id);
    const messageId = await fromSnowflake(message_id);
    const emojiId = emojisMap[emoji] ? emoji : await tryFromSnowflake(emoji.replaceAll(REACTION_EXTRACT_ID, ""));

    await res.rvAPI.delete(`/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emojiId)}`);

    res.sendStatus(204);
  },
  get: async (req, res) => {
    const { channel_id, message_id, emoji } = req.params;
    const { limit } = req.query as { limit: string };

    if (!channel_id || !message_id || !emoji) throw new HTTPError("Invalid params");

    const channelId = await fromSnowflake(channel_id);
    const messageId = await fromSnowflake(message_id);
    const emojiId = emojisMap[emoji] ? emoji : await tryFromSnowflake(emoji.replaceAll(/(.*)(:|%)/gs, ""));
    if (!emojiId) throw new HTTPError("Invalid emoji id", 404);

    const rvMessage = await res.rvAPI.get(`/channels/${channelId as ""}/messages/${messageId as ""}`);

    const emojis = rvMessage.reactions
      ? Object.entries(rvMessage.reactions)
        .find(([key]) => key === emojiId)
      : [];

    if (!emojis?.[1]) throw new HTTPError("Message has no reactions");

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!Number.isNaN(parsedLimit)) emojis.splice(parsedLimit - 1);
    }

    // FIXME: Partially implemented - Needs full info
    const users = await Promise.all(emojis[1].map((x) => User.from_quark({
      _id: x,
      username: "fixme",
      discriminator: "0001",
    })));

    res.json(users);
  },
};
