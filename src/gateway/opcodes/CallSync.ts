/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import { DbManager } from "@reflectcord/common/db";
import { fromSnowflake } from "@reflectcord/common/models";
import { Logger } from "@reflectcord/common/utils";
import { ChannelType, GatewayDispatchEvents, GatewayOpcodes } from "discord.js";
import { Dispatch, Send } from "../util";
import { WebSocket } from "../Socket";
import { Payload } from "../util/Constants";
import { check } from "./instanceOf";

const CallSyncSchema = {
  channel_id: String,
};

const voiceStates = DbManager.client.db("reflectcord")
  .collection("voiceStates");
export async function CallSync(this: WebSocket, data: Payload<{ channel_id: string }>) {
  check.call(this, CallSyncSchema, data.d);

  const { channel_id } = data.d!;

  const rvChannelId = await fromSnowflake(channel_id);

  const rvChannel = await this.rvAPIWrapper.channels.fetch(rvChannelId).catch(Logger.error);
  if (
    !rvChannel
    || (rvChannel.discord.type !== ChannelType.DM
    && rvChannel.discord.type !== ChannelType.GroupDM)
  ) return;

  (await voiceStates.find({ channel_id }).toArray()).forEach(async (state) => {
    await Dispatch(this, GatewayDispatchEvents.VoiceStateUpdate, state);
  });
}
