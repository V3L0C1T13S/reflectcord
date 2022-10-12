import { setHeartbeat } from "../util/Heartbeat";
import { Send, Payload } from "../util";
import { WebSocket } from "../Socket";

export async function onHeartbeat(this: WebSocket, data: Payload) {
  // TODO: validate payload

  setHeartbeat(this);

  await Send(this, { op: 11 });
}
