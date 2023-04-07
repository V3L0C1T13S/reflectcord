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

/* eslint-disable no-param-reassign */
import { GatewayCloseCodes, GatewayOpcodes } from "discord.js";
import { IncomingMessage } from "http";
import ws from "ws";
import { Client } from "revolt.js";
import { API } from "revolt-api";
import { APIWrapper } from "@reflectcord/common/rvapi";
import { genSessionId, Logger } from "@reflectcord/common/utils";
import { reflectcordWsURL, revoltApiURL } from "@reflectcord/common/constants";
import { Deflate, Inflate } from "fast-zlib";
import { Tracer } from "@reflectcord/common/debug";
import { sendOp, setHeartbeat } from "../util";
import { SocketState, WebSocket } from "../Socket";
import { Message } from "./Message";
import { Close } from "./Close";

export async function Connection(this: ws.Server, socket: WebSocket, request: IncomingMessage) {
  socket.session_id = genSessionId();

  try {
    // @ts-ignore
    socket.on("close", Close);

    // @ts-ignore
    socket.on("message", Message);

    socket.on("error", (e) => Logger.error(`Gateway: ${e}`));

    const { searchParams } = new URL(`http://localhost${request.url}`);
    Logger.log(searchParams.toString());
    // @ts-ignore
    socket.encoding = searchParams.get("encoding") || "json";
    if (!["json", "etf"].includes(socket.encoding)) {
      return socket.close(GatewayCloseCodes.DecodeError);
    }

    socket.version = searchParams.get("version")?.toNumber() ?? searchParams.get("v")?.toNumber() ?? 6;
    if (socket.version < 6) return socket.close(GatewayCloseCodes.InvalidAPIVersion);

    // @ts-ignore
    socket.compress = searchParams.get("compress") || "";
    if (socket.compress) {
      if (socket.compress !== "zlib-stream") return socket.close(GatewayCloseCodes.DecodeError);
      socket.deflate = new Deflate();
      socket.inflate = new Inflate();
    }

    socket.events = {};
    socket.member_events = {};
    socket.permissions = {};
    socket.sequence = 0;
    socket.subscribed_servers = {};
    socket.lazy_channels = {};
    socket.subscribed_members = [];

    socket.rvClient = new Client({
      apiURL: revoltApiURL,
    });
    socket.rvAPI = new API({
      baseURL: revoltApiURL,
    });
    // @ts-ignore
    socket.rvAPIWrapper = new APIWrapper(socket.rvAPI);
    socket.state = new SocketState();
    socket.trace = new Tracer(`gateway-prd-${new URL(reflectcordWsURL).host}`);

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
