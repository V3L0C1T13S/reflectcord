import { RESTPostAPIChannelMessageJSONBody } from "discord.js";
import { Tuple } from "../../../../utils/check";

export const MessageCreateSchema = {
  $content: String,
  $nonce: new Tuple(String, Number),
  $tts: Boolean,
  $embeds: [],
  $allowed_mentions: [],
  $message_reference: null,
  $components: [],
  $sticker_ids: [String],
  $attachments: [],
  $flags: Number,
};

// eslint-disable-next-line no-redeclare
export type MessageCreateSchema = RESTPostAPIChannelMessageJSONBody;
