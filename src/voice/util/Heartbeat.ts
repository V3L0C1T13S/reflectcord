/* eslint-disable no-param-reassign */
import { WebSocket } from "./WebSocket";
import { VoiceOPCodes } from "../../common/sparkle";

export function setHeartbeat(socket: WebSocket) {
  if (socket.heartbeatTimeout) clearTimeout(socket.heartbeatTimeout);

  socket.heartbeatTimeout = setTimeout(
    () => socket.close(VoiceOPCodes.ClientDisconnect),
    1000 * 45,
  );
}
