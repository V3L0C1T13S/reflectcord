import { Logger } from "../../common/utils";
import { WebSocket } from "../Socket";

export async function Close(this: WebSocket, code: number, reason: string) {
  Logger.log(`WS Closed ${code} ${reason}`);
  if (this.heartbeatTimeout) clearTimeout(this.heartbeatTimeout);
  if (this.readyTimeout) clearTimeout(this.readyTimeout);
  this.deflate?.close();
  this.removeAllListeners();

  // Getting out of revolt
  this.rvClient.removeAllListeners();
  await this.rvClient.logout(true);
  Logger.log("Logged out of revolt");
}
