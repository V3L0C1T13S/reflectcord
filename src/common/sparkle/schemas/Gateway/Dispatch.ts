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
  ReadySupplemental = "READY_SUPPLEMENTAL",
  PassiveUpdateV1 = "PASSIVE_UPDATE_V1",
  GuildIntegrationsUpdate = "GUILD_INTEGRATIONS_UPDATE",
  GuildMemberListUpdate = "GUILD_MEMBER_LIST_UPDATE",
  GuildSync = "GUILD_SYNC",
  GuildApplicationCommandsUpdate = "GUILD_APPLICATION_COMMANDS_UPDATE",
  IntegrationUpdate = "INTEGRATION_UPDATE",
  InteractionCreate = "INTERACTION_CREATE",
  InteractionSuccess = "INTERACTION_SUCCESS",
  VoiceChannelEffectSend = "VOICE_CHANNEL_EFFECT_SEND",
  StreamCreate = "STREAM_CREATE",
  StreamUpdate = "STREAM_UPDATE",
  StreamServerUpdate = "STREAM_SERVER_UPDATE",
  StreamDelete = "STREAM_DELETE",
  StreamWatch = "STREAM_WATCH",
  SessionsReplace = "SESSIONS_REPLACE",
  CallCreate = "CALL_CREATE",
  CallUpdate = "CALL_UPDATE",
  CallDelete = "CALL_DELETE",
  RelationshipAdd = "RELATIONSHIP_ADD",
  RelationshipRemove = "RELATIONSHIP_REMOVE",
  EmbeddedActivityUpdate = "EMBEDDED_ACTIVITY_UPDATE",
  ThreadListSync = "THREAD_LIST_SYNC",
  MessageAck = "MESSAGE_ACK",
  UserSettingsUpdate = "USER_SETTINGS_UPDATE",
  UserSettingsProtoUpdate = "USER_SETTINGS_PROTO_UPDATE",
  UserNonChannelAck = "USER_NON_CHANNEL_ACK",
  GuildApplicationCommandIndexUpdate = "GUILD_APPLICATION_COMMAND_INDEX_UPDATE",
  LastMessages = "LAST_MESSAGES",
  UserNoteUpdate = "USER_NOTE_UPDATE",
  InitialGuild = "INITIAL_GUILD",
  ConsoleCommandUpdate = "CONSOLE_COMMAND_UPDATE",
  UserConnectionsUpdate = "USER_CONNECTIONS_UPDATE",
  ChannelRecipientAdd = "CHANNEL_RECIPIENT_ADD",
  ChannelRecipientRemove = "CHANNEL_RECIPIENT_REMOVE",
  DeletedEntityIds = "DELETED_ENTITY_IDS",
}
