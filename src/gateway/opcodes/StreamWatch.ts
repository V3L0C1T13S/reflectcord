/* eslint-disable camelcase */
import { genVoiceToken } from "@reflectcord/common/utils";
import { reflectcordVoiceURL } from "@reflectcord/common/constants";
import { emitEvent } from "@reflectcord/common/Events";
import { fromSnowflake } from "@reflectcord/common/models";
import { VoiceState } from "@reflectcord/common/mongoose";
import { WebSocket } from "../Socket";
import { Payload, Dispatch } from "../util";
import { check } from "./instanceOf";
import { GatewayDispatchCodes } from "../../common/sparkle/schemas/Gateway/Dispatch";

const StreamWatchSchema = {
  stream_key: String,
};

// eslint-disable-next-line no-redeclare
interface StreamWatchSchema {
  stream_key: string;
}

interface StreamWatchBody {
  stream_key: string;
  allow_multiple: boolean;
}

export async function StreamWatch(this: WebSocket, data: Payload<StreamWatchSchema>) {
  check.call(this, StreamWatchSchema, data.d);

  const { stream_key } = data.d!;

  const state = await VoiceState.findOne({ user_id: this.user_id });
  if (!state?.channel_id) throw new Error("You aren't in a voice call.");

  const body = {
    paused: false,
    region: "",
    rtc_server_id: "0",
    stream_key,
    viewer_ids: [this.user_id],
  };

  await Dispatch(this, GatewayDispatchCodes.StreamCreate, body);

  await Dispatch(this, GatewayDispatchCodes.StreamServerUpdate, {
    endpoint: reflectcordVoiceURL,
    guild_id: null,
    stream_key,
    token: genVoiceToken(),
  });

  await emitEvent({
    event: GatewayDispatchCodes.StreamUpdate,
    data: {
      paused: false,
      region: "",
      rtc_server_id: "0",
      stream_key,
      viewer_ids: [this.user_id],
    },
    channel_id: await fromSnowflake(state.channel_id),
  });
}
