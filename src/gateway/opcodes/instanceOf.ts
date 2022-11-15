import { GatewayCloseCodes } from "discord.js";
import { instanceOf } from "../../common/utils";
import { WebSocket } from "../Socket";

export function check(this: WebSocket, schema: any, data: any) {
  try {
    const error = instanceOf(schema, data, { path: "body" });
    if (error !== true) {
      throw error;
    }
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    // invalid payload
    this.close(GatewayCloseCodes.DecodeError);
    throw error;
  }
}
