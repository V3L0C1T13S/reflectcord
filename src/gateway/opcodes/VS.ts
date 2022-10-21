/* eslint-disable camelcase */
import { VoiceStateSchema } from "../../common/sparkle";
import { WebSocket } from "../Socket";
import { Payload } from "../util";
import { check } from "./instanceOf";

export function VSUpdate(this: WebSocket, data: Payload) {
  check.call(this, VoiceStateSchema, data.d);
  const { self_mute, self_deaf, self_video } = data.d;

  this.voiceInfo = {
    self_mute,
    self_deaf,
    self_video,
  };
}
