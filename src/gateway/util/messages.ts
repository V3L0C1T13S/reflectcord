import { Message } from "@reflectcord/common/models";
import { GatewayDispatchEvents, GatewayMessageUpdateDispatchData } from "discord.js";
import { ClientboundNotification } from "revolt.js";
import { WebSocket } from "../Socket";
import { Dispatch } from "./send";

export async function updateMessage(this: WebSocket, data: ClientboundNotification & { type: "MessageUpdate" | "MessageAppend" }) {
  const msgObj = await this.rvAPIWrapper.messages.fetch(
    data.channel,
    data.id,
    { mentions: true },
  );
  const updatedData = "data" in data ? data.data : data.append;
  const updatedRevolt = { ...msgObj.revolt, ...updatedData };
  this.rvAPIWrapper.messages.update(data.id, {
    revolt: updatedData,
    discord: await Message.from_quark(updatedRevolt, {
      mentions: (await this.rvAPIWrapper.messages
        .getMessageMentions(updatedRevolt))
        .map((x) => x.revolt),
    }),
  });

  const channel = await this.rvAPIWrapper.channels.fetch(data.channel);

  const body: GatewayMessageUpdateDispatchData = {
    ...msgObj.discord,
  };

  if ("guild_id" in channel.discord && channel.discord.guild_id) body.guild_id = channel.discord.guild_id;

  await Dispatch(this, GatewayDispatchEvents.MessageUpdate, body);

  return msgObj;
}
