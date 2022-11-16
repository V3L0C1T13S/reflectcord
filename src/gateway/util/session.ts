import { GatewayOpcodes } from "discord.js";
import { WebSocket } from "../Socket";
import { Send } from "./send";

export async function invalidateSession(session: WebSocket, resume: boolean) {
  await Send(session, {
    op: GatewayOpcodes.InvalidSession,
    d: resume,
  });
}
