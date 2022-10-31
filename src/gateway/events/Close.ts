import { Logger } from "../../common/utils";
import { WebSocket } from "../Socket";
import { dbEventBus } from "../../common/events";

export async function Close(this: WebSocket, code: number, reason: string) {
  Logger.log(`WS Closed ${code} ${reason}`);
  if (this.heartbeatTimeout) clearTimeout(this.heartbeatTimeout);
  if (this.readyTimeout) clearTimeout(this.readyTimeout);
  this.deflate?.close();
  this.removeAllListeners();

  if (this.typingListener) dbEventBus.removeListener("CHANNEL_START_TYPING", this.typingListener);

  // Getting out of revolt
  this.rvClient.removeAllListeners();
  await this.rvClient.logout(true);
  Logger.log("Logged out of revolt");
}
