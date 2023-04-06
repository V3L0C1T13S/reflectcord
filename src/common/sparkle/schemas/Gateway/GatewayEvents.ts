import { GatewayChannelUpdateDispatchData } from "discord.js";

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export interface GatewayHashValue {
  omitted: boolean;
  hash: string;
}

export interface GatewayHash {
  channels: GatewayHashValue,
  metadata: GatewayHashValue,
  roles: GatewayHashValue,
  version: number,
}

export type GatewayUserChannelUpdateDispatchData = GatewayChannelUpdateDispatchData & {
  guild_hashes: GatewayHash,
  hashes: GatewayHash,
  version: number,
}

export type GatewayUserChannelUpdateOptional = PartialBy<
  GatewayUserChannelUpdateDispatchData, "guild_hashes" | "hashes" | "version"
>

export interface GatewayUserSettingsProtoUpdateDispatchData {
  partial: boolean,
  settings: {
    proto: string,
    type: number,
  }
}
