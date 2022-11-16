import { GatewayOpcodes, GatewayCloseCodes } from "discord.js";
import { setHeartbeat } from "../util/Heartbeat";
import { Send, Payload } from "../util";
import { WebSocket } from "../Socket";

export async function onHeartbeat(this: WebSocket, data: Payload) {
  if (Number.isNaN(data.d)) return this.close(GatewayCloseCodes.DecodeError);

  setHeartbeat(this);

  await Send(this, {
    op: GatewayOpcodes.HeartbeatAck,
    d: null,
  });
}
