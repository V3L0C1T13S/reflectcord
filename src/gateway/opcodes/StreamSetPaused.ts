/* eslint-disable camelcase */
import { emitEvent } from "@reflectcord/common/Events";
import { GatewayDispatchEvents } from "discord.js";
import { fromSnowflake } from "@reflectcord/common/models";
import { GatewayDispatchCodes } from "@reflectcord/common/sparkle/schemas/Gateway/Dispatch";
import { reflectcordVoiceURL } from "@reflectcord/common/constants";
import { genVoiceToken } from "@reflectcord/common/utils";
import { Dispatch, Payload } from "../util";
import { WebSocket } from "../Socket";
import { voiceStates } from "./VS";
import { check } from "./instanceOf";

const StreamSetPausedSchema = {
  stream_key: String,
  paused: Boolean,
};

// eslint-disable-next-line no-redeclare
interface StreamSetPausedSchema {
  stream_key: string;
  paused: boolean;
}

export async function StreamSetPaused(this: WebSocket, data: Payload<StreamSetPausedSchema>) {
  check.call(this, StreamSetPausedSchema, data.d);
  // Stream key looks like this: guild_id:channel_id:user_id
  const { stream_key, paused } = data.d!;

  const state = await voiceStates.findOne({ user_id: this.user_id });
  if (!state) throw new Error("Invalid state");

  if (!state.channel_id) throw new Error("Not connected to a voice channel");

  this.voiceInfo.self_stream = true;
  state.self_stream = true;

  await voiceStates.updateOne({ user_id: this.user_id }, {
    $set: state,
  });

  await emitEvent({
    event: GatewayDispatchEvents.VoiceStateUpdate,
    data: state,
    channel_id: await fromSnowflake(state.channel_id),
  });

  await Dispatch(this, GatewayDispatchCodes.StreamCreate, {
    paused,
    region: "",
    rtc_server_id: "0",
    stream_key,
    viewer_ids: [],
  });

  await Dispatch(this, GatewayDispatchCodes.StreamServerUpdate, {
    endpoint: reflectcordVoiceURL,
    guild_id: null,
    stream_key,
    token: genVoiceToken(),
  });
}
