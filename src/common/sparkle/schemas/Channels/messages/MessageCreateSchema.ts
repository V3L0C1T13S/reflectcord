import { RESTPostAPIChannelMessageJSONBody } from "discord.js";
import { Tuple } from "../../../../utils/check";
import { AllowedMentions } from "./AllowedMentions";
import { MessageReferenceSend } from "./MessageReference";

export const MessageCreateSchema = {
  $content: String,
  $nonce: new Tuple(String, Number),
  $tts: Boolean,
  $embeds: [],
  $allowed_mentions: AllowedMentions,
  $message_reference: MessageReferenceSend,
  $components: [],
  $sticker_ids: [String],
  $attachments: [],
  $flags: Number,
  $channel_id: String,
  $type: Number,
};

// eslint-disable-next-line no-redeclare
export type MessageCreateSchema = RESTPostAPIChannelMessageJSONBody;
