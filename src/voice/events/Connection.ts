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
    if (socket.version > 7) return socket.close(GatewayCloseCodes.UnknownError, "invalid version");

    setHeartbeat(socket);

    socket.readyTimeout = setTimeout(
      () => socket.close(GatewayCloseCodes.SessionTimedOut),
      1000 * 30,
    );

    await Send(socket, {
      op: VoiceOPCodes.Hello,
      d: {
        // v: 7,
        heartbeat_interval: 1000 * 30,
      },
    });
  } catch (e) {
    Logger.error(`rtc: ${e}`);
    return socket.close(GatewayCloseCodes.UnknownError);
  }
}
