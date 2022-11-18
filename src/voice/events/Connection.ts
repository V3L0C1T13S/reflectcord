/* eslint-disable no-param-reassign */
import { IncomingMessage } from "http";
import ws from "ws";
import { GatewayCloseCodes } from "discord.js";
import { Logger } from "@reflectcord/common/utils";
import { VoiceOPCodes } from "@reflectcord/common/sparkle";
import { Send, setHeartbeat, WebSocket } from "../util";
import { onMessage } from "./Message";
import { onClose } from "./Close";

export async function onConnect(this: ws.Server, socket: WebSocket, request: IncomingMessage) {
  try {
    // @ts-ignore
    socket.on("close", onClose);
    // @ts-ignore
    socket.on("message", onMessage);

    socket.encoding = "json";
    socket.version = 4;
    if (socket.version < 3) return socket.close(GatewayCloseCodes.UnknownError, "invalid version");

    setHeartbeat(socket);

    socket.readyTimeout = setTimeout(
      () => socket.close(GatewayCloseCodes.SessionTimedOut),
      1000 * 30,
    );

    await Send(socket, {
      op: VoiceOPCodes.Hello,
      d: {
        v: 7,
        heartbeat_interval: 1000 * 30,
      },
    });
  } catch (e) {
    Logger.error(`rtc: ${e}`);
    return socket.close(GatewayCloseCodes.UnknownError);
  }
}
