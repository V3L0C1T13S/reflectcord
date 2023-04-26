/* eslint-disable no-restricted-syntax */
import emojilib from "emojilib";
import emojiJson from "unicode-emoji-json";
import { getEditDistance } from "./algorithim";

// This value was picked experimentally.
// Substring search returns a lot of noise for shorter search words.
const MIN_WORD_LENGTH_FOR_SUBSTRING_SEARCH = 4;

const emojiMap = emojiJson as unknown as Record<any, any>;

// These are partially extracted from Discords backend via tests
const customRelevantEmojis = {
  "🐧": [
    ...emojilib["🐧"],
    "linux",
    "debian",
    "ubuntu",
    "archlinux",
  ],
  "💻": [
    ...emojilib["💻"],
    "terminal",
    "bash",
    "zsh",
    "csh",
    "freebsd",
    "bsd",
    "system",
    "git",
    "github",
    "gitlab",
    "programming",
    "development",
    "csharp",
    "c#",
    "rust",
    "php",
    "html",
    "css",
    "batch",
    "powershell",
  ],
  "📜": [
    ...emojilib["📜"],
    "javascript",
    "typescript",
    "coffeescript",
    "script",
    "js",
    "ts",
    "rules",
    "changelog",
    "log",
    "changes",
  ],
  "🌐": [
    ...emojilib["🌐"],
    "general",
    "translator",
    "translators",
    "translation",
    "languages",
    "language",
  ],
  "📣": [
    ...emojilib["📣"],
    "announce",
    "announcements",
    "updates",
  ],
  "🤣": [
    ...emojilib["🤣"],
    "meme",
    "memes",
  ],
  "🎮": [
    ...emojilib["🎮"],
    "gaming",
    "games",
    "gamer",
    "xbox",
  ],
  "🎨": [
    ...emojilib["🎨"],
    "art",
    "themes",
    "anime",
  ],
  "🤨": [
    ...emojilib["🤨"],
    "sus",
  ],
  "📬": [
    ...emojilib["📬"],
    "suggestion",
    "suggestions",
    "mail",
    "spam",
  ],
  "🔊": [
    ...emojilib["🔊"],
    "voice",
  ],
  "💁": [
    ...emojilib["💁"],
    "author",
  ],
  "🔒": [
    ...emojilib["🔒"],
    "mfa",
    "moderator",
    "moderation",
  ],
  "👮": [
    ...emojilib["👮"],
    "staff",
  ],
  "👥": [
    ...emojilib["👥"],
    "employees",
  ],
  "📖": [
    ...emojilib["📖"],
    "resource",
    "resources",
  ],
  "🍥": [
    ...emojilib["🍥"],
    "anime",
  ],
  "🤝": [
    ...emojilib["🤝"],
    "collaborate",
    "partner",
    "partnership",
  ],
  "🐾": [
    ...emojilib["🐾"],
    "mascot",
  ],
  "🖼️": [
    ...emojilib["🖼️"],
    "image",
    "images",
    "img",
  ],
  "🔥": [
    ...emojilib["🔥"],
    "revolt",
  ],
  "🤔": [
    ...emojilib["🤔"],
    "amogus",
  ],
  "🐟": [
    ...emojilib["🐟"],
    "subnautica",
  ],
  "💡": [
    ...emojilib["💡"],
    "ideas",
    "idea",
  ],
  "🔍": [
    ...emojilib["🔍"],
    "cplusplus",
    "c++",
  ],
  "💾": [
    ...emojilib["💾"],
    "snippet",
    "snippets",
  ],
  "💬": [
    ...emojilib["💬"],
    "offtopic",
    "topic",
  ],
  "🚑": [
    ...emojilib["🚑"],
    "triage",
  ],
  "📝": [
    ...emojilib["📝"],
    "log",
    "logs",
  ],
};

// eslint-disable-next-line guard-for-in
for (const emoji in emojiMap) {
  // @ts-ignore
  emojiMap[emoji]["keywords"] = emojilib[emoji];
}

// eslint-disable-next-line guard-for-in
for (const emoji in customRelevantEmojis) {
  // @ts-ignore
  emojiMap[emoji]["keywords"] = customRelevantEmojis[emoji];
}

/**
 * TODO: Discord seems to also include some relevant metadata
 * about common words to help it find emojis (ex. michigan is a state,
 * so use a building emoji because states have buildings)
*/
export const getEmojilibEmojis = (input: string) => {
  const regexSource = input.toLowerCase().split(/\s/g)
    .map((v) => v.replace(/\W/g, ""))
    .filter((v) => v.length > 0)
    .map((v) => (v.length < MIN_WORD_LENGTH_FOR_SUBSTRING_SEARCH ? `^${v}$` : v))
    .join("|");

  if (regexSource.length === 0) {
    return [];
  }

  const regex = new RegExp(regexSource);
  const emoji = [];

  for (const [name, data] of Object.entries(emojiJson)) {
    let matches = regex.test(name);
    // @ts-ignore
    for (const keyword of data.keywords) {
      matches = matches || regex.test(keyword);
    }

    if (!matches) {
      // @ts-ignore
      for (const keyword of data.keywords) {
        matches = matches || getEditDistance(input.toLowerCase(), keyword) >= 300;
      }
    }

    if (matches) {
      // @ts-ignore
      emoji.push(name);
    }
  }

  return emoji;
};
