import { Send, WebSocket } from "../util";
import { VoiceOPCodes } from "../../common/sparkle";

export async function onResume(this: WebSocket, data: any) {
  await Send(this, {
    op: VoiceOPCodes.Resumed,
    d: {},
  });
}
