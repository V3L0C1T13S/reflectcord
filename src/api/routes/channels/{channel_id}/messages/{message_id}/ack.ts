/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { fromSnowflake } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

export default () => <Resource> {
  post: async (req, res) => {
    const { channel_id, message_id } = req.params;

    if (!message_id || !channel_id) throw new HTTPError("Invalid params", 422);

    const rvMsgId = await fromSnowflake(message_id);
    const rvChannelId = await fromSnowflake(channel_id);

    await res.rvAPIWrapper.messages.ack(rvChannelId, rvMsgId);

    res.json({
      token: null,
    });
  },
};
