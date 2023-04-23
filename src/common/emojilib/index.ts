import emojiMap from "emojilib";

export const emojis = emojiMap as Record<string, string[]>;

export const getEmojiNamesByUnicode = (name: string) => emojis[name];

export const isBuiltinEmoji = (name: string) => !!getEmojiNamesByUnicode(name);

export * from "./relevant";
