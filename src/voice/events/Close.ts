import { Logger } from "../../common/utils";
import { WebSocket } from "../util";

export async function onClose(this: WebSocket, code: number, reason: string) {
  Logger.log(`rtc closed: ${code} ${reason}`);

  this.removeAllListeners();
}
