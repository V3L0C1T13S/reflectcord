/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import { GatewayCloseCodes, GatewayOpcodes } from "discord.js";
import erlpack from "erlpack";
import { Logger } from "@reflectcord/common/utils";
import { Payload } from "../util";
import { WebSocket } from "../Socket";
import { OPCodeHandlers } from "../opcodes";

export async function Message(this: WebSocket, buffer: Buffer) {
  let data: Payload;

  if (
    (buffer instanceof Buffer && buffer[0] === 123) // ASCII 123 = `{`. Bad check for JSON
    || typeof buffer === "string"
  ) {
    data = JSON.parse(buffer.toString());
  } else if (this.encoding === "etf" && buffer instanceof Buffer) {
    try {
      data = erlpack.unpack(buffer);
    } catch {
      return this.close(GatewayCloseCodes.DecodeError);
    }
  } else if (this.encoding === "json" && buffer instanceof Buffer) {
    if (this.inflate) {
      try {
        buffer = this.inflate.process(buffer) as any;
      } catch {
        buffer = buffer.toString() as any;
      }
    }
    data = JSON.parse(buffer as unknown as string);
  } else {
    Logger.log(`Session ${this.session_id} sent an undecodable invalid payload.`);
    return this.close(GatewayCloseCodes.DecodeError);
  }

  Logger.log(`Message: ${JSON.stringify(data)}`);
  if (data.op !== GatewayOpcodes.Heartbeat) {
    // FIXME: Implement validation here
  } else if (data.s || data.t || (typeof data.d !== "number" && data.d)) {
    Logger.log("Invalid heartbeat");
    this.close(GatewayCloseCodes.DecodeError);
  }

  const OPCodeHandler = OPCodeHandlers[data.op];
  if (!OPCodeHandler) {
    // FIXME: Close connection if all opcodes are implemented
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
