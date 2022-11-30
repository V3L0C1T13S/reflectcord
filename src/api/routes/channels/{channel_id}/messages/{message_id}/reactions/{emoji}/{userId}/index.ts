/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { HTTPError, REACTION_EXTRACT_ID } from "@reflectcord/common/utils";
import { fromSnowflake, tryFromSnowflake } from "@reflectcord/common/models";
import { emojis as emojisMap } from "@reflectcord/common/emojilib";

export default () => <Resource> {
  delete: async (req, res) => {
    const {
      channel_id, message_id, emoji, userId,
    } = req.params;

    if (!channel_id || !message_id || !emoji || !userId) throw new HTTPError("Invalid params");

    const channelId = await fromSnowflake(channel_id);
    const messageId = await fromSnowflake(message_id);
    const rvUserId = userId !== "@me" ? await fromSnowflake(userId) : null;
    const emojiId = emojisMap[emoji] ? emoji : await tryFromSnowflake(emoji.replaceAll(REACTION_EXTRACT_ID, ""));

    await res.rvAPI.delete(`/channels/${channelId}/messages/${messageId}/reactions/${encodeURI(emojiId)}`, {
      user_id: rvUserId,
    });

    res.sendStatus(204);
  },

  put: async (req, res) => {
    const {
      channel_id, message_id, emoji, userId,
    } = req.params;

    if (userId !== "@me") throw new HTTPError("Invalid uid");

    if (!channel_id || !message_id || !emoji) throw new HTTPError("Invalid params");

    const channelId = await fromSnowflake(channel_id);
    const messageId = await fromSnowflake(message_id);
    const emojiId = emojisMap[emoji] ? emoji : await tryFromSnowflake(emoji.replaceAll(REACTION_EXTRACT_ID, ""));

    await res.rvAPI.put(`/channels/${channelId}/messages/${messageId}/reactions/${encodeURI(emojiId)}`);

    res.sendStatus(204);
  },
};
