/* eslint-disable no-param-reassign */
import { GatewayCloseCodes, GatewayOpcodes } from "discord.js";
import { IncomingMessage } from "http";
import ws from "ws";
import { createDeflate } from "zlib";
import { Client } from "revolt.js";
import { API } from "revolt-api";
import { APIWrapper } from "@reflectcord/common/rvapi";
import { Logger } from "@reflectcord/common/utils";
import { revoltApiURL } from "@reflectcord/common/constants";
import { sendOp, setHeartbeat } from "../util";
import { SocketState, WebSocket } from "../Socket";
import { Message } from "./Message";
import { Close } from "./Close";

export async function Connection(this: ws.Server, socket: WebSocket, request: IncomingMessage) {
  try {
    // @ts-ignore
    socket.on("close", Close);

    // @ts-ignore
    socket.on("message", Message);

    const { searchParams } = new URL(`http://localhost${request.url}`);
    Logger.log(searchParams.toString());
    // @ts-ignore
    socket.encoding = searchParams.get("encoding") || "json";
    if (!["json", "etf"].includes(socket.encoding)) {
      return socket.close(GatewayCloseCodes.DecodeError);
    }

    socket.version = 8;
    if (socket.version !== 8) return socket.close(GatewayCloseCodes.InvalidAPIVersion);

    // @ts-ignore
    socket.compress = searchParams.get("compress") || "";
    if (socket.compress) {
      if (socket.compress !== "zlib-stream") return socket.close(GatewayCloseCodes.DecodeError);
      socket.deflate = createDeflate({ chunkSize: 65535 });
      socket.deflate.on("data", (chunk) => socket.send(chunk));
    }

    socket.events = {};
    socket.member_events = {};
    socket.permissions = {};
    socket.sequence = 0;
    socket.subscribed_servers = {};

    socket.rvClient = new Client({
      apiURL: revoltApiURL,
    });
    socket.rvAPI = new API({
      baseURL: revoltApiURL,
    });
    socket.rvAPIWrapper = new APIWrapper(socket.rvAPI);
    socket.state = new SocketState();

    setHeartbeat(socket);

    socket.readyTimeout = setTimeout(
      () => socket.close(GatewayCloseCodes.SessionTimedOut),
      1000 * 30,
    );

    await sendOp(socket, GatewayOpcodes.Hello, {
      heartbeat_interval: 1000 * 30,
    });
  } catch (e) {
    Logger.error(e);
    return socket.close(GatewayCloseCodes.UnknownError);
  }
}
