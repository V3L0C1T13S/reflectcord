import { GatewayOpcodes } from "discord.js";
import { Send, Payload } from "../util";
import { WebSocket } from "../Socket";

export async function onResume(this: WebSocket, data: Payload) {
  // FIXME: Stub
  await Send(this, {
    op: GatewayOpcodes.InvalidSession,
    d: false,
  });
}
