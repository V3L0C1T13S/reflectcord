/* eslint-disable no-console */
import { GatewayCloseCodes, GatewayOpcodes } from "discord.js";
import erlpack from "erlpack";
import { Payload } from "../util";
import { WebSocket } from "../Socket";
import { OPCodeHandlers } from "../opcodes";

export async function Message(this: WebSocket, buffer: Buffer) {
  let data: Payload;

  if (this.encoding === "etf" && buffer instanceof Buffer) data = erlpack.unpack(buffer);
  else if (this.encoding === "json") {
    data = JSON.parse(buffer as unknown as string);
  } else {
    console.log("Invalid gateway connection.");
    return;
  }

  if (data.op !== GatewayOpcodes.Heartbeat) {
    // FIXME: Implement validation here
  } else if (data.s || data.t || (typeof data.d !== "number" && data.d)) {
    console.log("Invalid heartbeat...");
    this.close(GatewayCloseCodes.DecodeError);
  }

  const OPCodeHandler = OPCodeHandlers[data.op];
  if (!OPCodeHandler) {
    console.error(`Unknown opcode ${data.op}`);
    return;
  }

  try {
    const res = await OPCodeHandler.call(this, data);
    return res;
  } catch (e) {
    console.error(e);
    if (!this.CLOSED && this.CLOSING) return this.close(GatewayCloseCodes.UnknownError);
  }
}
