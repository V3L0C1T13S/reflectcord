import { GatewayOpcodes } from "discord.js";
import { WebSocket } from "../Socket";
import { Payload } from "../util";
import { onHeartbeat } from "./Heartbeat";
import { onIdentify } from "./Identify";
import { presenceUpdate } from "./PresenceUpdate";
import { onResume } from "./Resume";

export type OPCodeHandler = (this: WebSocket, data: Payload) => any;

export const OPCodeHandlers: { [key: number ]: OPCodeHandler } = {
  [GatewayOpcodes.Heartbeat]: onHeartbeat,
  [GatewayOpcodes.Identify]: onIdentify,
  // [GatewayOpcodes.PresenceUpdate]: presenceUpdate,
  [GatewayOpcodes.Resume]: onResume,
};
