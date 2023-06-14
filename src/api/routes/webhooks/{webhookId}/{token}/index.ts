import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { Message, MessageSendData, fromSnowflake } from "@reflectcord/common/models";
import { HttpStatusCode } from "axios";
import { Request } from "express";
import { RESTPostAPIWebhookWithTokenJSONBody } from "discord.js";
import API from "revolt-api";

export default () => <Resource> {
  post: async (req: Request<any, any, RESTPostAPIWebhookWithTokenJSONBody>, res) => {
    const { webhookId, token } = req.params;
    const { wait } = req.query;

    if (!webhookId) throw new HTTPError("invalid params");

    const rvWebhookId = await fromSnowflake(webhookId);

    // @ts-ignore
    const response = await res.rvAPI.post(`/webhooks/${rvWebhookId as ""}/${token as ""}`, await MessageSendData.to_quark(req.body)) as API.Message;

    if (wait) {
      res.json(await Message.from_quark(response));
    } else res.sendStatus(HttpStatusCode.NoContent);
  },
};
