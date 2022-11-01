/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { Application } from "express";
import { API } from "revolt.js";
import { HTTPError } from "../../../../../../../../common/utils";
import { fromSnowflake } from "../../../../../../../../common/models/util";
import { Message, User } from "../../../../../../../../common/models";

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

    const rvMessage = await res.rvAPI.get(`/channels/${channelId}/messages/${messageId}`) as API.Message;

    res.json([(await Message.from_quark(rvMessage)).author]);
  },
};
