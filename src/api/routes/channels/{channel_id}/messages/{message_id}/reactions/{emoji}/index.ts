/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { Application } from "express";
import { HTTPError } from "@reflectcord/common/utils";
import { fromSnowflake, User } from "@reflectcord/common/models";
import { emojis as emojisMap } from "@reflectcord/common/emojilib";

export default (express: Application) => <Resource> {
  delete: async (req, res) => {
    const { channel_id, message_id, emoji } = req.params;

    if (!channel_id || !message_id || !emoji) throw new HTTPError("Invalid params");

    const channelId = await fromSnowflake(channel_id);
    const messageId = await fromSnowflake(message_id);

    await res.rvAPI.delete(`/channels/${channelId}/messages/${messageId}/reactions/${encodeURI(emoji)}`);

    res.sendStatus(204);
  },
  get: async (req, res) => {
    const { channel_id, message_id, emoji } = req.params;

    if (!channel_id || !message_id || !emoji) throw new HTTPError("Invalid params");

    const channelId = await fromSnowflake(channel_id);
    const messageId = await fromSnowflake(message_id);
    const emojiId = emojisMap[emoji] ? emoji : emoji.split(":")?.[1];
    if (!emojiId) throw new HTTPError("Invalid emoji id", 404);

    const rvMessage = await res.rvAPI.get(`/channels/${channelId as ""}/messages/${messageId as ""}`);

    const emojis = rvMessage.reactions
      ? Object.entries(rvMessage.reactions)
        .find(([key]) => key === emojiId)
      : [];

    if (!emojis?.[1]) throw new HTTPError("Message has no reactions");

    // FIXME: Partially implemented - Needs full info
    const users = await Promise.all(emojis[1].map((x) => User.from_quark({
      _id: x,
      username: "fixme",
    })));

    res.json(users);
  },
};
