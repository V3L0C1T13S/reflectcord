/* eslint-disable no-plusplus */
import { GatewayOpcodes } from "discord.js";
import erlpack from "erlpack";
import { WebSocket } from "../Socket";
import { Payload } from "./Constants";

export async function Send(socket: WebSocket, data: Payload) {
  if (socket.encoding !== "etf" && socket.encoding !== "json") return;

  const buffer = socket.encoding === "etf" ? erlpack.pack(data) : JSON.stringify(data);

  // FIXME: Compression is unsupported
  if (socket.deflate) {
    socket.deflate.write(buffer);
    socket.deflate.flush();
    return;
  }

  return new Promise((res, rej) => {
    if (socket.readyState !== 1) {
      // eslint-disable-next-line no-promise-executor-return, prefer-promise-reject-errors
      return rej("socket not open");
    }
    socket.send(buffer, (err: any) => {
      if (err) return rej(err);
      // if (data.s) socket.state.store.push(data);
      return res(null);
    });
  });
}

/**
 * Send an OPCode, but only the actual OP. The rest is
 * filled with null values.
*/
export function sendOp(socket: WebSocket, op: GatewayOpcodes, data: Payload["d"]) {
  return Send(socket, {
    op,
    // t: null,
    // s: null,
    d: data,
  });
}

export function Dispatch(socket: WebSocket, event: string, data: Payload["d"]) {
  return Send(socket, {
    op: GatewayOpcodes.Dispatch,
    t: event,
    // eslint-disable-next-line no-param-reassign
    s: socket.sequence++,
    d: data,
  });
}
