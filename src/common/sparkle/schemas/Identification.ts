/*
  Fosscord: A FOSS re-implementation and extension of the Discord.com backend.
  Copyright (C) 2023 Fosscord and Fosscord Contributors

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published
  by the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/* eslint-disable no-redeclare */
import { ActivitySchema } from "./User";
import { Tuple } from "../../utils/check";

export const IdentifySchema = {
  token: String,
  $intents: Number,
  $properties: Object,
  $presence: ActivitySchema,
  $compress: Boolean,
  $large_threshold: Number,
  $largeThreshold: Number,
  $shard: [Number, Number],
  $guild_subscriptions: Boolean,
  $capabilities: Number,
  $client_state: {
    $guild_hashes: Object,
    $highest_last_message_id: new Tuple(String, Number),
    $read_state_version: Number,
    $user_guild_settings_version: Number,
    $useruser_guild_settings_version: new Tuple(String, Number),
    $user_settings_version: undefined,
    $private_channels_version: Number,
    $guild_versions: Object,
    $api_code_version: Number,
    $guildHashes: Object,
    $highestLastMessageId: Number,
    $readStateVersion: Number,
    $userGuildSettingsVersion: Number,
    $useruserGuildSettingsVersion: Number,
  },
  $clientState: {
    $guildHashes: Object,
    $highestLastMessageId: Number,
    $readStateVersion: Number,
    $useruserGuildSettingsVersion: undefined,
    $userGuildSettingsVersion: undefined,
  },
  $v: Number,
  $version: Number,
  // OLD/DEPRECATED
  $synced_guilds: [Number],
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
  largeThreshold?: number;
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
    guildHashes?: any;
    highestLastMessageId?: number;
    readStateVersion?: number;
    userGuildSettingsVersion?: number;
    useruserGuildSettingsVersion?: number;
  },
  clientState?: {
    guildHashes?: any;
    highestLastMessageId?: number;
    readStateVersion?: number;
    userGuildSettingsVersion?: number;
    useruserGuildSettingsVersion?: number;
  },
  v?: number,
  version?: number,
}
