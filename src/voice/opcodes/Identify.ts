import { Logger } from "../../common/utils";
import { Send, WebSocket } from "../util";
import { VoiceOPCodes } from "../../common/sparkle/schemas/voice/opcodes";

export async function onIdentify(this: WebSocket, data: any) {
  Logger.log("Identifying...");

  const identify = data.d!;

  const { token } = identify;

  await Send(this, {
    op: VoiceOPCodes.Ready,
    d: {
      streams: [],
      ssrc: 1,
      ip: "127.0.0.1",
      port: 3015,
      modes: ["xsalsa20_poly1305", "xsalsa20_poly1305_suffix", "xsalsa20_poly1305_lite"],
      heartbeat_interval: 1,
      experiments: [],
    },
  });
}
