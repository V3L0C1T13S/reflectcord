import {
  APIChannel,
  APIGuild,
  APIGuildMember,
  APIGuildScheduledEvent,
  APIRole,
  APIStageInstance,
  APISticker,
  APIThreadChannel,
  GatewayPresenceUpdate,
  GatewayVoiceState,
} from "discord.js";
import { discordGatewayGuildEmoji } from "../../../models/models/emoji";
import { GatewayHash } from "./GatewayEvents";

export type GuildHashes = GatewayHash;

export interface CommonGatewayGuild {
  embedded_activities?: unknown[],
  channels: APIChannel[];
  joined_at: string;
  large: boolean;
  member_count: number;
  members: APIGuildMember[];
  threads: APIThreadChannel[];
  stage_instances: APIStageInstance[];
  guild_scheduled_events: APIGuildScheduledEvent[];
  presences: GatewayPresenceUpdate[];
  voice_states: GatewayVoiceState[];
}

export interface CommonUserGatewayGuild extends CommonGatewayGuild {
  guild_hashes?: GuildHashes;
  home_header: unknown;
  latest_onboarding_question_id: unknown,
  safety_alerts_channel_id: string | null,
  max_video_channel_users: number,
  max_stage_video_channel_users: number,
}

export interface UserGatewayGuild extends Omit<CommonUserGatewayGuild, "members"> {
  application_command_counts: unknown,
  id: string;
  data_mode: "full" | "lazy"
  stickers: APISticker[];
  roles: APIRole[];
  emojis: discordGatewayGuildEmoji[];
  properties: APIGuild;
  lazy: boolean;
  premium_subscription_count?: number;
  version: number;
}
