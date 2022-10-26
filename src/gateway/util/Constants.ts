import { GatewayOpcodes } from "discord.js";

export interface Payload<T = any> {
  op: GatewayOpcodes;
  d?: T;
  s?: number;
  t?: string;
}
