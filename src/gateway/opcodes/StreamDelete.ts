/* eslint-disable camelcase */
import { GatewayDispatchCodes } from "@reflectcord/common/sparkle/schemas/Gateway/Dispatch";
import { GatewayDispatchEvents } from "discord.js";
import { emitEvent } from "@reflectcord/common/Events";
import { fromSnowflake } from "@reflectcord/common/models";
import { WebSocket } from "../Socket";
import { Dispatch, Payload } from "../util";
import { check } from "./instanceOf";
import { voiceStates } from "./VS";

const StreamDeleteSchema = {
  stream_key: String,
};

// eslint-disable-next-line no-redeclare
interface StreamDeleteSchema {
  stream_key: string;
}

interface StreamDeleteBody {
  reason: string;
  stream_key: string;
}

export async function StreamDelete(this: WebSocket, data: Payload) {
  check.call(this, StreamDeleteSchema, data.d);

  const { stream_key } = data.d;

  const state = await voiceStates.findOne({ user_id: this.user_id });
  if (!state?.self_stream) throw new Error("Not streaming");

  this.voiceInfo.self_stream = false;
  state.self_stream = false;

  const body: StreamDeleteBody = {
    reason: "user_requested",
    stream_key,
  };

  const rvChannelId = await fromSnowflake(state.channel_id);

  await voiceStates.updateOne({ user_id: this.user_id }, {
    $set: state,
  });

  await emitEvent({
    event: GatewayDispatchCodes.StreamDelete,
    data: body,
    channel_id: rvChannelId,
  });

  await emitEvent({
    event: GatewayDispatchEvents.VoiceStateUpdate,
    data: state,
    channel_id: rvChannelId,
  });
}
