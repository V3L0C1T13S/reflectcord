import { GatewayOpcodes } from "discord.js";
import { setHeartbeat } from "../util/Heartbeat";
import { Payload, sendOp } from "../util";
import { WebSocket } from "../Socket";

export async function onHeartbeat(this: WebSocket, data: Payload) {
  // if (Number.isNaN(data.d)) return this.close(GatewayCloseCodes.DecodeError);

  setHeartbeat(this);

  await sendOp(this, GatewayOpcodes.HeartbeatAck, null);
}
