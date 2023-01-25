import { APIGuildMember, PresenceData } from "discord.js";

export interface LazyGroup {
  /** Role ID OR "offline" OR "online" */
  id: string,
  count: number,
}

export type LazyOpMember = APIGuildMember & {
  presence: PresenceData,
}

export type SyncItem = LazyGroup | LazyOpMember;

export type LazySyncType = "SYNC" | "INVALIDATE" | "INSERT" | "DELETE" | "UPDATE";

export interface LazyOperator {
  op: LazySyncType,
}

export type LazyRange = [number, number];

export interface LazyOperatorSync extends LazyOperator {
  op: "SYNC",
  range: LazyRange,
  items: SyncItem[],
}

export interface LazyOperatorInvalidate extends LazyOperator {
  op: "INVALIDATE",
  range: LazyRange,
}

export interface LazyOperatorInsert extends LazyOperator {
  op: "INSERT",
  index: number,
  item: SyncItem,
}

export interface LazyOperatorUpdate extends LazyOperator {
  op: "UPDATE",
  index: number,
  item: SyncItem,
}

export interface LazyOperatorDelete extends LazyOperator {
  op: "DELETE",
  index: number,
}

export type LazyOperators = LazyOperatorSync
  | LazyOperatorInvalidate
  | LazyOperatorInsert
  | LazyOperatorUpdate;

export interface GatewayLazyRequestDispatchData {
  id: string,
  guild_id: string,
  ops: LazyOperators[],
  groups: LazyGroup[],
}
