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

export interface UserGatewayGuild extends CommonGatewayGuild {
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
