/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "../../../../../../../common/utils";
import { fromSnowflake } from "../../../../../../../common/models/util";

export default (express: Application) => <Resource> {
  delete: async (req, res) => {
    const { channel_id, message_id } = req.params;

    if (!channel_id || !message_id) throw new HTTPError("Invalid params");

    const channelId = await fromSnowflake(channel_id);
    const messageId = await fromSnowflake(message_id);

    await res.rvAPI.delete(`/channels/${channelId}/messages/${messageId}/reactions`);

    res.sendStatus(204);
  },
};
