/* eslint-disable no-redeclare */
import { APIMessageReference, APIMessageReferenceSend } from "discord.js";
import { Tuple } from "../../../../utils/check";

export const MessageReference = {
  $message_id: new Tuple(String, Number),
  $channel_id: new Tuple(String, Number),
  $guild_id: new Tuple(String, Number),
};

export const MessageReferenceSend = {
  ...MessageReference,
  $message_id: new Tuple(String, Number),
  $fail_if_not_exists: Boolean,
};

export type MessageReference = APIMessageReference;
export type MessageReferenceSend = APIMessageReferenceSend;
