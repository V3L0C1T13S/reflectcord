export interface Metadata {}

export interface Action {
  type: number;
  metadata?: Metadata;
}

export interface Trigger_metadata {
  mention_total_limit?: number;
}

export interface RulesResponse {
  id: string;
  guild_id: string;
  creator_id: string;
  name: string;
  event_type: number;
  actions: Action[];
  trigger_type: number;
  trigger_metadata: Trigger_metadata;
  enabled: boolean;
  exempt_roles: string[];
  exempt_channels: string[];
}

export type RulesPOST = RulesResponse;

export interface RootObject {
  name: string;
  guild_id: string;
  event_type: number;
  trigger_type: number;
  trigger_metadata: Trigger_metadata;
  actions: Action[];
  enabled: boolean;
  creator_id: string;
  position: number;
  exempt_channels: string[];
  exempt_roles: string[];
}
