import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { Webhook, fromSnowflake } from "@reflectcord/common/models";
import API from "revolt-api";

export default () => <Resource> {
  get: async (req, res) => {
    const { webhookId } = req.params;

    if (!webhookId) throw new HTTPError("invalid params");

    const rvWebhookId = await fromSnowflake(webhookId);

    // @ts-ignore
    const webhook = await res.rvAPI.get(`/webhooks/${rvWebhookId}`) as API.Webhook;

    res.json(await Webhook.from_quark(webhook));
  },
};
