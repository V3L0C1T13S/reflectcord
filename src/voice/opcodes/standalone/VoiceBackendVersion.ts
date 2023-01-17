import { VoiceOPCodes } from "@reflectcord/common/sparkle";
import { Payload } from "@reflectcord/gateway/util";
import { Send, WebSocket } from "../../util";

export async function VoiceBackendVersion(this: WebSocket, data: Payload) {
  await Send(this, {
    op: VoiceOPCodes.VoiceBackendVersion,
    d: {
      voice: "0.8.51",
      rtc_worker: "0.3.33",
    },
  });
}
