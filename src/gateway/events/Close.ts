import { WebSocket } from "../Socket";

export async function Close(this: WebSocket, code: number, reason: string) {
  console.log(`WS Closed ${code} ${reason}`);
  if (this.heartbeatTimeout) clearTimeout(this.heartbeatTimeout);
  if (this.readyTimeout) clearTimeout(this.readyTimeout);
  this.deflate?.close();
  this.removeAllListeners();
}
