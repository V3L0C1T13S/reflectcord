/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
import { Replies } from "amqplib";
import { API } from "revolt-api";
import { Client } from "revolt.js";
import WS from "ws";
import { Deflate, Inflate } from "fast-zlib";
import { APIWrapper } from "../common/rvapi";
import { Payload } from "./util";

export class SocketState {
  store: Payload[] = [];
}

interface subscribedServer {
  /**
   * Will we receive TYPING_START for this guild?
  */
  typing?: boolean;
  /**
   * Update subscribed user status?
  */
  activities?: boolean;
  /**
   * Subscribed to new thread creations
  */
  threads?: boolean;
}

/**
 * A custom (but hacky) optimization to discords message events
 * To put it simply: You only receive messages for things you've requested
 * via OP14, OP8, and OP12.
 */
interface lazyChannel {
  messages?: boolean;
}

export interface WebSocket extends WS {
  bot: boolean;
  subscribed_servers: Record<string, subscribedServer>;
  lazy_channels: Record<string, lazyChannel>;
  enable_lazy_channels: boolean;
  is_deprecated: boolean;
  version: number;
  user_id: string;
  rv_user_id: string;
  session_id: string;
  encoding: "etf" | "json";
  compress?: "zlib-stream";
  shard_count?: number;
  shard_id?: number;
  deflate?: Deflate;
  inflate?: Inflate;
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
    self_deaf: boolean;
    self_mute: boolean;
    self_video: boolean;
    self_stream?: boolean;
    channel_id?: string | null | undefined;
    guild_id?: string;
  };
  typingConsumer?: Replies.Consume | undefined;
  state: SocketState;
  token: string;
}
