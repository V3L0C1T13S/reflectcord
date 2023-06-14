import API from "revolt-api";
import { GatewayDispatchEvents, GatewayWebhooksUpdateDispatchData } from "discord.js";
import { WebSocket } from "../Socket";
import { Dispatch } from "./send";

export async function updateWebhook(this: WebSocket, data: API.Webhook) {
  const channel = this.rvAPIWrapper.channels.get(data.channel_id);
  if (!channel || !("guild_id" in channel.discord)) return;

  const body: GatewayWebhooksUpdateDispatchData = {
    guild_id: channel.discord.guild_id,
    channel_id: channel.discord.id,
  };

  await Dispatch(this, GatewayDispatchEvents.WebhooksUpdate, body);
}
