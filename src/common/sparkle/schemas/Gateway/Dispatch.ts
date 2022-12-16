import { GatewayDispatchEvents, User } from "discord.js";

export type IntegrationType = "youtube" | "twitch";

interface Role {
  hash: string;
}

interface Metadata {
  hash: string;
}

interface Channel {
  hash: string;
}

interface Hashe {
  version: number;
  roles: Role;
  metadata: Metadata;
  channels: Channel;
}

interface Account {
  name: string;
  id: string;
}

export interface IntegrationGuildHashes {
  version: number;
  roles: Role;
  metadata: Metadata;
  channels: Channel;
}

export interface IntegrationUpdateResponse {
  user: User;
  type: IntegrationType;
  syncing: boolean;
  synced_at: string;
  subscriber_count: number;
  role_id: string;
  revoked: boolean;
  name: string;
  id: string;
  hashes: Hashe;
  guild_hashes: IntegrationGuildHashes;
  expire_grace_period: number;
  expire_behavior: number;
  enabled: boolean;
  enable_emoticons: boolean;
  account: Account;
  guild_id: string;
}

export interface GuildIntegrationsUpdateResponse {
  guild_id: string;
}

export enum GatewayDispatchCodes {
  PassiveUpdateV1 = "PASSIVE_UPDATE_V1",
  GuildIntegrationsUpdate = "GUILD_INTEGRATIONS_UPDATE",
  IntegrationUpdate = "INTEGRATION_UPDATE",
  VoiceChannelEffectSend = "VOICE_CHANNEL_EFFECT_SEND",
  StreamCreate = "STREAM_CREATE",
  StreamUpdate = "STREAM_UPDATE",
  StreamServerUpdate = "STREAM_SERVER_UPDATE",
  StreamDelete = "STREAM_DELETE",
  StreamWatch = "STREAM_WATCH",
}
