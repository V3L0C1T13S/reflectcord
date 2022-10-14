/* eslint-disable no-param-reassign */
import { GatewayCloseCodes, GatewayOpcodes } from "discord.js";
import { IncomingMessage } from "http";
import ws from "ws";
import { createDeflate } from "zlib";
import { Client } from "revolt.js";
import { Send, setHeartbeat } from "../util";
import { WebSocket } from "../Socket";
import { Message } from "./Message";
import { Close } from "./Close";

export async function Connection(this: ws.Server, socket: WebSocket, request: IncomingMessage) {
  try {
    // @ts-ignore
    socket.on("close", Close);

    // @ts-ignore
    socket.on("message", Message);

    const { searchParams } = new URL(`http://localhost${request.url}`);
    // @ts-ignore
    socket.encoding = searchParams.get("encoding") || "json";

    socket.version = 8;
    if (socket.version !== 8) return socket.close(GatewayCloseCodes.InvalidAPIVersion);

    // @ts-ignore
    socket.compress = "zlib-stream";
    if (socket.compress) {
      if (socket.compress !== "zlib-stream") return socket.close(GatewayCloseCodes.DecodeError);
      socket.deflate = createDeflate({ chunkSize: 65535 });
      socket.deflate.on("data", (chunk) => socket.send(chunk));
    }

    socket.events = {};
    socket.member_events = {};
    socket.permissions = {};
    socket.sequence = 0;

    socket.rvClient = new Client();

    setHeartbeat(socket);

    await Send(socket, {
      op: GatewayOpcodes.Hello,
      d: {
        heartbeat_interval: 1000 * 30,
      },
    });

    socket.readyTimeout = setTimeout(
      () => socket.close(GatewayCloseCodes.SessionTimedOut),
      1000 * 30,
    );
  } catch (e) {
    console.error(e);
    return socket.close(GatewayCloseCodes.UnknownError);
  }
}
