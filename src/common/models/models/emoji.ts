import { APIEmoji, APIPartialEmoji, APIReaction } from "discord.js";
import { API } from "revolt.js";
import { QuarkConversion } from "../QuarkConversion";
import { User } from "./user";

export const PartialEmoji: QuarkConversion<API.Emoji, APIPartialEmoji> = {
  async to_quark(emoji) {
    const { name, id, animated } = emoji;

    return {
      name: name ?? "fixme",
      animated: animated ?? false,
      _id: id ?? "0",
      creator_id: "0",
      parent: {
        type: "Detached",
      },
    };
  },

  async from_quark(emoji) {
    const { name, _id, animated } = emoji;

    return {
      name,
      id: _id,
      animated: animated ?? false,
    };
  },
};

export const Emoji: QuarkConversion<API.Emoji, APIEmoji> = {
  async to_quark(emoji) {
    return PartialEmoji.to_quark(emoji);
  },

  async from_quark(emoji) {
    return {
      ...await PartialEmoji.from_quark(emoji),
      available: true,
      roles: [],
      user: await User.from_quark({
        _id: emoji.creator_id,
        username: "fixme",
      }),
    };
  },
};

export const Reactions: QuarkConversion<API.Message["reactions"]
, APIReaction[]> = {
  async to_quark(reaction) {
    return {};
  },

  async from_quark(reactions) {
    if (!reactions) return [];

    const discordEmojis = await Promise.all(Object.entries(reactions)
      .map(([value, key]) => PartialEmoji.from_quark({
        _id: value,
        creator_id: "0",
        parent: {
          type: "Detached",
        },
        name: "fixme",
      })));

    return Promise.all(discordEmojis.map((x) => ({
      // FIXME: ugly ugly ugly ew ew ew
      count: Object.entries(reactions).find(([em, k]) => x.id === em)?.[1].length ?? 0,
      me: false,
      emoji: x,
    })));
  },
};
