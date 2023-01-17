import { Logger } from "@reflectcord/common/utils";
import { WebSocket } from "../util";

export async function onClose(this: WebSocket, code: number, reason: string) {
  Logger.log(`rtc closed: ${code} ${reason}`);

  if (this.vortex_ws) {
    try {
      this.vortex_ws.close(1000);
    } catch (e) {
      Logger.error(`failed to disconnect from vortex: ${e}`);
    }
  }

  this.removeAllListeners();
}
