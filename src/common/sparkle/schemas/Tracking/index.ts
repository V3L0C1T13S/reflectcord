import { ChannelType } from "discord.js";

/**
 * Just want to put it out there, the way discord does tracking is dumb.
 * This could all be done serverside. WITHOUT the need for extreme amounts
 * of bandwidth waste.
*/

export type TrackingProperties = {
  client_send_timestamp: number,
  client_track_timestamp: number,
  client_uuid: number,
}

export type ChannelProperties = {
  channel_hidden: boolean,
  channel_id: string,
  channel_member_perms: number,
  channel_size_total: number,
  channel_type: ChannelType,
}

export type GuildProperties = {
  guild_id: string,
  guild_is_vip: boolean,
  guild_member_num_roles: number,
  guild_member_perms: number,
  guild_num_channels: number,
  guild_num_roles: number,
  guild_num_text_channels: number,
  guild_num_voice_channels: number,
  guild_size_total: number,
}

export type ListProperties = {
  num_users_visible: number,
  num_users_visible_with_mobile_indicator: number,
}

export type TrackingEvents = "member_list_viewed"
  | "ack_messages"
  | "dm_list_viewed"
  | "channel_opened"
  | "af_loaded"
  | "af_exited"
  | "open_popout"
