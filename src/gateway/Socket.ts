/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
import { Replies } from "amqplib";
import { API } from "revolt-api";
import { Client } from "revolt.js";
import WS from "ws";
import { Deflate } from "zlib";
import { APIWrapper } from "../common/rvapi";
import { Payload } from "./util";

export class SocketState {
  store: Payload[] = [];
}

export interface WebSocket extends WS {
  version: number;
  user_id: string;
  session_id: string;
  encoding: "etf" | "json";
  compress?: "zlib-stream";
  shard_count?: number;
  shard_id?: number;
  deflate?: Deflate;
  heartbeatTimeout: NodeJS.Timeout;
  readyTimeout: NodeJS.Timeout;
  intents: any;
  sequence: number;
  permissions: Record<string, any>;
  events: Record<string, Function>;
  member_events: Record<string, Function>;
  listen_options: any;
  rvClient: Client;
  rvAPI: API;
  rvAPIWrapper: APIWrapper;
  voiceInfo: {
    self_deaf: boolean,
    self_mute: boolean,
    self_video: boolean,
    channel_id?: string,
    guild_id?: string,
  }
  typingConsumer?: Replies.Consume | undefined,
  state: SocketState,
}
