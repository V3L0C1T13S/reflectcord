import { RESTPostAPIChannelMessageJSONBody } from "discord.js";
import { Tuple } from "../../../../utils/check";
import { AllowedMentions } from "./AllowedMentions";
import { AttachmentSchema } from "./Attachment";
import { EmbedSchema } from "./Embed";
import { MessageReferenceSend } from "./MessageReference";

export const MessageCreateSchema = {
  $content: String,
  $nonce: new Tuple(String, Number),
  $tts: Boolean,
  $embeds: [EmbedSchema],
  $allowed_mentions: AllowedMentions,
  $message_reference: MessageReferenceSend,
  $components: [Object],
  $sticker_ids: [String],
  $attachments: [AttachmentSchema],
  $flags: Number,
  // These usually exist when attachments are present
  $channel_id: String,
  $type: Number,
};

// eslint-disable-next-line no-redeclare
export type MessageCreateSchema = RESTPostAPIChannelMessageJSONBody;
