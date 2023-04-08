import emojiMap from "./emojis.json";

export const emojis = emojiMap as Record<string, string[]>;

export const unicodeByName = (name: string) => emojis[name]?.[0];

export const isBuiltinEmoji = (name: string) => !!unicodeByName(name);
