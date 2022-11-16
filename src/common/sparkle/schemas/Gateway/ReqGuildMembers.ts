import { APIGuildMember } from "discord.js";
import { Tuple } from "../../../utils/check";
/* eslint-disable no-redeclare */
export const ReqGuildMembersSchema = {
  guild_id: new Tuple([String], String),
  // According to documentation, bots can also send a string to find a single user
  $user_ids: new Tuple([String], String),
  $query: String,
  $limit: Number,
  $presences: Boolean,
  $nonce: String,
};

export interface ReqGuildMembersSchema {
  guild_id: string[] | string,
  user_ids?: string[] | string,
  query?: string,
  limit?: number,
  presences?: boolean,
  nonce?: string | undefined,
}

/**
 * Sent in response to an OP8 Request guild members
 */
export interface GuildMembersChunk {
  guild_id: string | string[],
  members: APIGuildMember[],
  not_found?: string[],
  presences?: any[],
}
