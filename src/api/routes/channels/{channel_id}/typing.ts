/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { HTTPError, RabbitMQ } from "@reflectcord/common/utils";
import { fromSnowflake } from "@reflectcord/common/models";
import { userStartTyping } from "@reflectcord/common/events";

export default () => <Resource> {
  post: async (req, res) => {
    const { channel_id } = req.params;
    if (!channel_id) throw new HTTPError("Invalid id");

    const rvId = await fromSnowflake(channel_id);

    RabbitMQ.channel?.sendToQueue(userStartTyping, Buffer.from(JSON.stringify({
      token: req.token,
      channel: rvId,
    })));

    res.sendStatus(204);
  },
};
