import { Send, setHeartbeat, WebSocket } from "../util";
import { VoiceOPCodes } from "../../common/sparkle";

export async function onHeartbeat(this: WebSocket, data: any) {
  const nonce = data.d;

  setHeartbeat(this);

  await Send(this, { op: VoiceOPCodes.HeartbeatAck, d: nonce });
}
