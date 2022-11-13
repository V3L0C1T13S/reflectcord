/* eslint-disable no-undef */
import ws from "ws";

export interface WebSocket extends ws {
  ticket: string,
  heartbeatTimeout: NodeJS.Timeout,
  readyTimeout: NodeJS.Timeout,
}
