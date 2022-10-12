import { Send, Payload } from "../util";
import { WebSocket } from "../Socket";

export async function onResume(this: WebSocket, data: Payload) {
  console.log("FIXME resume unimpl.");
  await Send(this, {
    op: 9,
    d: false,
  });
}
