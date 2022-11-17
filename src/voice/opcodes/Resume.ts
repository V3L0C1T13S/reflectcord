import { GatewayCloseCodes } from "discord.js";
import { WebSocket } from "../util";

export async function onResume(this: WebSocket, data: any) {
  return this.close(GatewayCloseCodes.SessionTimedOut);
}
