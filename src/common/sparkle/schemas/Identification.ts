/* eslint-disable no-redeclare */
import { ActivitySchema } from "./User";

export const IdentifySchema = {
  token: String,
  $intents: Number,
  $properties: Object,
  $presence: ActivitySchema,
  $compress: Boolean,
  $large_threshold: Number,
  $shard: [Number, Number],
  $guild_subscriptions: Boolean,
  $capabilities: Number,
  $client_state: {
    $guild_hashes: Object,
    $highest_last_message_id: String,
    $read_state_version: Number,
    $user_guild_settings_version: Number,
    $user_settings_version: undefined,
    $private_channels_version: Number,
    $guild_versions: Object,
    $api_code_version: Number,
  },
  $v: Number,
  $version: Number,
};

export interface IdentifySchema {
  token: string,
  properties: {
    os?: string;
    os_atch?: string;
    browser?: string;
    device?: string;
    $os?: string;
    $browser?: string;
    $device?: string;
    browser_user_agent?: string;
    browser_version?: string;
    os_version?: string;
    referrer?: string;
    referring_domain?: string;
    referrer_current?: string;
    referring_domain_current?: string;
    release_channel?: "stable" | "dev" | "ptb" | "canary";
    client_build_number?: number;
    client_event_source?: any;
    client_version?: string;
    system_locale?: string;
  };
  intents?: number,
  presence?: typeof ActivitySchema,
  compress?: boolean,
  large_threshold?: number,
  shard?: [number, number],
  guild_subscriptions?: boolean,
  capabilities?: number,
  client_state?: {
    guild_hashes?: any,
    highest_last_message_id?: string,
    read_state_version?: number,
    user_guild_settings_version?: number;
    user_settings_version?: number,
    private_channels_version?: number,
    guild_version?: any,
    api_code_version?: number,
  },
  v?: number,
  version?: number,
}
