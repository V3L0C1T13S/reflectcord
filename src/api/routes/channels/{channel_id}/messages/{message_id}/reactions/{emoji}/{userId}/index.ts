/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { HTTPError } from "../../../../../../../../../common/utils";
import { fromSnowflake } from "../../../../../../../../../common/models/util";

export default () => <Resource> {
  delete: async (req, res) => {
    const {
      channel_id, message_id, emoji, userId,
    } = req.params;

    if (!channel_id || !message_id || !emoji || !userId) throw new HTTPError("Invalid params");

    const channelId = await fromSnowflake(channel_id);
    const messageId = await fromSnowflake(message_id);
    const rvUserId = userId !== "@me" ? await fromSnowflake(userId) : null;

    await res.rvAPI.delete(`/channels/${channelId}/messages/${messageId}/reactions/${encodeURI(emoji)}`, {
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

    await res.rvAPI.put(`/channels/${channelId}/messages/${messageId}/reactions/${encodeURI(emoji)}`);

    res.sendStatus(204);
  },
};
