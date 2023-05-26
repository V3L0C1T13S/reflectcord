/*
  Fosscord: A FOSS re-implementation and extension of the Discord.com backend.
  Copyright (C) 2023 Fosscord and Fosscord Contributors

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published
  by the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/* eslint-disable no-plusplus */
import { GatewayOpcodes } from "discord.js";
import erlpack from "erlpack";
import { Logger } from "@reflectcord/common/utils";
import { WebSocket } from "../Socket";
import { Payload } from "./Constants";

export async function Send(socket: WebSocket, data: Payload) {
  if (socket.encoding !== "etf" && socket.encoding !== "json") return;

  Logger.log(`Outgoing WS Message: ${JSON.stringify(data)}`);

  let buffer = socket.encoding === "etf" ? erlpack.pack(data) : JSON.stringify(data);

  // FIXME: Compression is unsupported
  if (socket.deflate) {
    buffer = socket.deflate.process(buffer) as Buffer;
  }

  return new Promise((res, rej) => {
    if (socket.readyState !== 1) {
      // eslint-disable-next-line no-param-reassign
      socket.pendingMessages ??= [];
      socket.pendingMessages.push(data);

      // eslint-disable-next-line no-promise-executor-return
      return res(null);
    }
    socket.send(buffer, (err: any) => {
      if (err) return rej(err);
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
    // @ts-ignore
    t: null,
    // @ts-ignore
    s: null,
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
