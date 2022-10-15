/* eslint-disable camelcase */
import { WebSocket } from "../Socket";
import { Payload } from "../util";

export function VSUpdate(this: WebSocket, data: Payload) {
  const { self_mute, self_deaf, self_video } = data.d;

  this.voiceInfo = {
    self_mute,
    self_deaf,
    self_video,
  };
}
