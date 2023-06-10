/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { fromSnowflake, Webhook, WebhookCreateBody } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";
import { Request, Response } from "express";
import { RESTGetAPIChannelWebhooksResult, RESTPostAPIChannelWebhookJSONBody, RESTPostAPIChannelWebhookResult } from "discord.js";

export default () => <Resource> {
  get: async (req, res: Response<RESTGetAPIChannelWebhooksResult>) => {
    const { channel_id } = req.params;

    if (!channel_id) throw new HTTPError("bad params");

    const rvChannelId = await fromSnowflake(channel_id);

    const webhooks = await res.rvAPIWrapper.channels.fetchWebhooks(rvChannelId);

    res.json(await Promise.all(webhooks.map((x) => Webhook.from_quark(x))));
  },
  post: async (
    req: Request<any, RESTPostAPIChannelWebhookJSONBody>,
    res: Response<RESTPostAPIChannelWebhookResult>,
  ) => {
    const { channel_id } = req.params;

    if (!channel_id) throw new HTTPError("bad params");

    const rvChannelId = await fromSnowflake(channel_id);

    const revoltWebhook = await res.rvAPI.post(`/channels/${rvChannelId as ""}/webhooks`, await WebhookCreateBody.to_quark(req.body));

    res.json(await Webhook.from_quark(revoltWebhook));
  },
};
