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

/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
import { Replies } from "amqplib";
import { API } from "revolt-api";
import { Client } from "revolt.js";
import WS from "ws";
import { Deflate, Inflate } from "fast-zlib";
import { MemberList } from "@reflectcord/common/utils/discord/MemberList";
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
  /**
   * Members we're subscribed to
   */
  members?: string[];
  memberList?: MemberList
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
  subscribed_members: string[];
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
    guild_id?: string | null | undefined;
  };
  typingConsumer?: Replies.Consume | undefined;
  state: SocketState;
  token: string;
}
