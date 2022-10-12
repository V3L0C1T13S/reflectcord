import { Send, Payload } from "../util";
import { WebSocket } from "../Socket";

export async function onIdentify(this: WebSocket, data: Payload) {
  clearTimeout(this.readyTimeout);

  const identify = data.d;
}
