/* eslint-disable camelcase */
import { WebSocket } from "gateway/Socket";
import { Payload } from "gateway/util";

export function VSUpdate(this: WebSocket, data: Payload) {
  const { self_mute, self_deaf, self_video } = data.d;

  this.voiceInfo = {
    self_mute,
    self_deaf,
    self_video,
  };
}
