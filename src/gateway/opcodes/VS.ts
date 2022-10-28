/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import { GatewayDispatchEvents, GatewayOpcodes } from "discord.js";
import { API } from "revolt.js";
import { fromSnowflake } from "../../common/models/util";
import { VoiceStateSchema } from "../../common/sparkle";
import { WebSocket } from "../Socket";
import { Payload, Send } from "../util";
import { check } from "./instanceOf";

export async function VSUpdate(this: WebSocket, data: Payload) {
  check.call(this, VoiceStateSchema, data.d);
  const {
    self_mute, self_deaf, self_video, guild_id, channel_id,
  } = data.d;

  this.voiceInfo = {
    self_mute,
    self_deaf,
    self_video,
    guild_id,
    channel_id,
  };

  if (channel_id) {
    const rvChannelId = await fromSnowflake(channel_id);
    const voiceData = await this.rvAPI.post(`/channels/${rvChannelId}/join_call`) as {
      token: string;
    };

    await Send(this, {
      op: GatewayOpcodes.Dispatch,
      t: GatewayDispatchEvents.VoiceServerUpdate,
      s: this.sequence++,
      d: {
        token: voiceData.token,
        guild_id,
        endpoint: "0.0.0.0",
      },
    });

    await Send(this, {
      op: GatewayOpcodes.Dispatch,
      t: GatewayDispatchEvents.VoiceStateUpdate,
      s: this.sequence++,
      d: this.voiceInfo,
    });
  }
}
