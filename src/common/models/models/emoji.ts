import { APIEmoji, APIPartialEmoji } from "discord.js";
import { API } from "revolt.js";
import { QuarkConversion } from "../QuarkConversion";
import { toSnowflake } from "../util";
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
