/* eslint-disable no-redeclare */
import { APIMessageReference, APIMessageReferenceSend } from "discord.js";

export const MessageReference = {
  $message_id: String,
  $channel_id: String,
  $guild_id: String,
};

export const MessageReferenceSend = {
  ...MessageReference,
  message_id: String,
  $fail_if_not_exists: Boolean,
};

export type MessageReference = APIMessageReference;
export type MessageReferenceSend = APIMessageReferenceSend;
