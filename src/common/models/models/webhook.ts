/* eslint-disable camelcase */
import { Webhook as revoltWebhook, CreateWebhookBody } from "revolt-api";
import { APIWebhook, RESTPostAPIChannelWebhookJSONBody, WebhookType } from "discord.js";
import { QuarkConversion } from "../QuarkConversion";
import { multipleFromSnowflake, toSnowflake } from "../util";
import { PartialFile } from "./attachment";

export const Webhook: QuarkConversion<revoltWebhook, APIWebhook> = {
  async to_quark(data) {
    const {
      id, name, channel_id, token, avatar,
    } = data;

    const [revoltId, rvChannelId] = await multipleFromSnowflake([id, channel_id]);

    const webhook: revoltWebhook = {
      id: revoltId!,
      name: name ?? "fixme",
      channel_id: rvChannelId!,
    };

    if (token) webhook.token = token;
    if (avatar) webhook.avatar = await PartialFile.to_quark(avatar);

    return webhook;
  },

  async from_quark(data) {
    const {
      id, name, channel_id, avatar, token,
    } = data;

    const discordWebhook: APIWebhook = {
      id: await toSnowflake(id),
      name,
      channel_id: await toSnowflake(channel_id),
      application_id: null,
      avatar: avatar ? await PartialFile.from_quark(avatar, { skipConversion: true }) : null,
      type: WebhookType.Incoming,
    };

    if (token) discordWebhook.token = token;

    return discordWebhook;
  },
};

export const WebhookCreateBody: QuarkConversion<
  CreateWebhookBody,
  RESTPostAPIChannelWebhookJSONBody
> = {
  async to_quark(data) {
    const { avatar } = data;

    const body: CreateWebhookBody = {
      name: data.name,
    };

    if (avatar) {
      body.avatar = avatar;
    }

    return body;
  },

  async from_quark(data) {
    const { avatar } = data;

    const body: RESTPostAPIChannelWebhookJSONBody = {
      name: data.name,
    };

    if (avatar) {
      body.avatar = avatar;
    }

    return body;
  },
};
