/* eslint-disable no-param-reassign */
import { IncomingMessage } from "http";
import ws from "ws";
import { Send, setHeartbeat, WebSocket } from "../util";
import { onMessage } from "./Message";
import { VoiceOPCodes } from "../../common/sparkle/schemas/voice/opcodes";
import { Logger } from "../../common/utils";

export async function onConnect(this: ws.Server, socket: WebSocket, request: IncomingMessage) {
  try {
  // @ts-ignore
    socket.on("message", onMessage);

    setHeartbeat(socket);

    socket.readyTimeout = setTimeout(
      () => socket.close(4009),
      1000 * 30,
    );
  } catch (e) {
    Logger.error(e);
    return socket.close(4000);
  }
}
