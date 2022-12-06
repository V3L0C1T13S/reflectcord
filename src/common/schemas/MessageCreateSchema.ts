export interface MessageCreateSchema {
  type?: number;
  content?: string;
  nonce?: string | number;
  channel_id?: string;
  tts?: boolean;
  flags?: string;
  embeds?: any[];
  embed?: any;
  allowed_mentions?: {
    parse?: string[];
    roles?: string[];
    users?: string[];
    replied_user?: boolean;
  };
  message_reference?: {
    message_id: string;
    channel_id: string;
    guild_id?: string;
    fail_if_not_exists?: boolean;
  };
  payload_json?: string;
  attachments?: any[];
  sticker_ids?: string[];
}
