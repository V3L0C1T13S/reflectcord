import { Payload } from "@reflectcord/gateway/util";
import { WebSocket } from "@reflectcord/gateway/Socket";
import { Logger } from "@reflectcord/common/utils";

// FIXME: STUB
export async function StreamCreate(this: WebSocket, data: Payload) {
  Logger.warn(`FIXME: STUB ${JSON.stringify(data)}`);
}
