/* eslint-disable no-redeclare */
export const ReqGuildMembersSchema = {
  guild_id: [],
  $user_ids: [],
  $query: String,
  $limit: Number,
  $presences: Boolean,
  $nonce: String,
};

export interface ReqGuildMembersSchema {
  guild_id: string[] | string,
  user_ids?: string[],
  query?: string,
  limit?: number,
  presences?: boolean,
  nonce?: string,
}
