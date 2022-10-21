import { ActivitySchema } from "./User";

export const IdentifySchema = {
  token: String,
  $intents: String,
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
  },
  $v: Number,
  $version: Number,
};
