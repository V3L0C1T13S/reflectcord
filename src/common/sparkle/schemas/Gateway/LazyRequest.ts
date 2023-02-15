import { APIGuildMember, PresenceData, PresenceStatus } from "discord.js";

export interface LazyGroup {
  /** Role ID OR "offline" OR "online" */
  id: string,
  count: number,
}

export type LazyOpMember = APIGuildMember & {
  presence: Omit<PresenceData, "status"> & {
    status?: PresenceStatus,
  },
}

export type SyncItem = LazyGroup | LazyOpMember;

export type LazyItemWithMember = { member: LazyOpMember }
export type LazyItemWithGroup = { group: LazyGroup }
export type LazyItem = LazyItemWithGroup | LazyItemWithMember;

export type LazySyncType = "SYNC" | "INVALIDATE" | "INSERT" | "DELETE" | "UPDATE";

export interface LazyOperator {
  op: LazySyncType,
  guild_id: string,
}

export type LazyRange = [number, number];

export interface LazyOperatorSync extends LazyOperator {
  op: "SYNC",
  range: LazyRange,
  items: LazyItem[],
  id: string,
  member_count: number,
  groups: LazyGroup[],
}

export interface LazyOperatorInvalidate extends LazyOperator {
  op: "INVALIDATE",
  range: LazyRange,
}

export interface LazyOperatorInsert extends LazyOperator {
  op: "INSERT",
  index: number,
  item: LazyItem,
}

export interface LazyOperatorUpdate extends LazyOperator {
  op: "UPDATE",
  index: number,
  item: LazyItem,
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
