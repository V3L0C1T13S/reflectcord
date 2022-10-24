/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { Application } from "express";
import { HTTPError } from "../../../../../../../../common/utils";
import { fromSnowflake } from "../../../../../../../../common/models/util";

export default (express: Application) => <Resource> {
  delete: async (req, res) => {
    const { channel_id, message_id, emoji } = req.params;

    if (!channel_id || !message_id || !emoji) throw new HTTPError("Invalid params");

    const channelId = await fromSnowflake(channel_id);
    const messageId = await fromSnowflake(message_id);

    await res.rvAPI.delete(`/channels/${channelId}/messages/${messageId}/reactions/${emoji}`);

    res.sendStatus(204);
  },
};
