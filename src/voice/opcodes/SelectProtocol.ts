import { Send, WebSocket } from "../util";
import { VoiceOPCodes } from "../../common/sparkle";

export async function selectProtocol(this: WebSocket, data: any) {
  // FIXME: What the hell is this?
  await Send(this, {
    op: 15,
    d: {
      any: 100,
    },
  });

  await Send(this, {
    op: VoiceOPCodes.SessionDescription,
    d: {},
  });
}
