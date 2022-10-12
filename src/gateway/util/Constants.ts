import { GatewayOpcodes } from "discord.js";

export interface Payload {
  op: GatewayOpcodes;
  d?: any;
  s?: number;
  t?: string;
}
