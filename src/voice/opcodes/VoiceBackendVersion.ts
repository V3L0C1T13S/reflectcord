import { Send, WebSocket } from "../util";
import { VoiceOPCodes } from "../../common/sparkle/schemas/voice/opcodes";

export async function VoiceBackendVersion(this: WebSocket, data: any) {
  await Send(this, {
    op: VoiceOPCodes.VoiceBackendVersion,
    d: {
      voice: "0.8.49",
      rtc_worker: "0.3.30",
    },
  });
}
