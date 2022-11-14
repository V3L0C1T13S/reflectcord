/* eslint-disable no-param-reassign */
import { GatewayCloseCodes } from "discord.js";
import { WebSocket } from "./WebSocket";
import { VoiceOPCodes } from "../../common/sparkle";

export function setHeartbeat(socket: WebSocket) {
  if (socket.heartbeatTimeout) clearTimeout(socket.heartbeatTimeout);

  socket.heartbeatTimeout = setTimeout(
    () => socket.close(GatewayCloseCodes.SessionTimedOut),
    1000 * 45,
  );
}
