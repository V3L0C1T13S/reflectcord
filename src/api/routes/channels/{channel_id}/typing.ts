/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { fromSnowflake } from "@reflectcord/common/models";
import { userStartTyping } from "@reflectcord/common/events";
import { RabbitMQ } from "@reflectcord/common/utils/RabbitMQ";

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
