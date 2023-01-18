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
