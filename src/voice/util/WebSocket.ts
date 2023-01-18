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

/* eslint-disable no-undef */
import { API } from "revolt-api";
import ws from "ws";
import { APIWrapper } from "@reflectcord/common/rvapi";
import { Device } from "msc-node";
import { Client } from "./MediaServer";

export interface WebSocket extends ws {
  ticket: string,
  heartbeatTimeout: NodeJS.Timeout,
  readyTimeout: NodeJS.Timeout,
  encoding: "json" | "etf",
  version: number,
  client: Client,
  sessionId: string,
  token: string,
  user_id: string,
  rvAPI: API,
  rvAPIWrapper: APIWrapper,
  bot: boolean,
  vortex_ws: ws,
  vortex_sequence: number,
  vortex_channel_id: string,
  vortex_token: string;
  vortex_device: {
    device: Device,
  }
}
