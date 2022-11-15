import { Send, WebSocket } from "../util";
import { VoiceOPCodes } from "../../common/sparkle";
import { Payload } from "../../gateway/util";

export async function VoiceBackendVersion(this: WebSocket, data: Payload) {
  await Send(this, {
    op: VoiceOPCodes.VoiceBackendVersion,
    d: {
      voice: "0.8.49",
      rtc_worker: "0.3.30",
    },
  });
}
