export const REVOLT_CHANNEL_MENTION = /<#([0-9ABCDEFGHJKMNPQRSTVWXYZ]{26})>/g;
export const REVOLT_USER_MENTION = /<@([0-9ABCDEFGHJKMNPQRSTVWXYZ]{26})>/g;
export const REVOLT_EMOJI_REGEX = /:([a-zA-Z0-9_+]+):/g;
export const REVOLT_ULID = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/;

export function isOnlyEmoji(text: string) {
  return text.replaceAll(REVOLT_EMOJI_REGEX, "").trim().length === 0;
}
