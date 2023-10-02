/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import { fromSnowflake } from "@reflectcord/common/models";
import { Logger } from "@reflectcord/common/utils";
import { ChannelType } from "discord.js";
import { VoiceState } from "@reflectcord/common/mongoose";
import { GatewayDispatchCodes } from "@reflectcord/common/sparkle";
import { Dispatch } from "../util";
import { WebSocket } from "../Socket";
import { Payload } from "../util/Constants";
import { check } from "./instanceOf";

const CallSyncSchema = {
  channel_id: String,
};

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

  const states = await VoiceState.find({ channel_id });

  if (!states.length) return;

  await Dispatch(this, GatewayDispatchCodes.CallCreate, {
    channel_id,
    message_id: "",
    region: "newark",
    ringing: [],
    voice_states: states.map((x) => x.toObject()),
  });
}
