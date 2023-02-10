import {
  APIEmoji, APIPartialEmoji, APIReaction, APIUser,
} from "discord.js";
import { API } from "revolt.js";
import { toSnowflake } from "@reflectcord/common/models";
import { emojis } from "../../emojilib";
import { QuarkConversion } from "../QuarkConversion";
import { tryFromSnowflake, tryToSnowflake } from "../util";
import { User } from "./user";

export type EmojiATQ = {};

export type EmojiAFQ = Partial<{
  user?: API.User | null | undefined,
  discordUser?: APIUser | null | undefined,
}>;

export const PartialEmoji: QuarkConversion<API.Emoji, APIPartialEmoji> = {
  async to_quark(emoji) {
    const { name, id, animated } = emoji;

    return {
      name: name ?? "fixme",
      animated: animated ?? false,
      _id: id ? await tryFromSnowflake(id) : "0",
      creator_id: "0",
      parent: {
        type: "Detached",
      },
    };
  },

  async from_quark(emoji) {
    const { name, _id, animated } = emoji;

    const unicodeEmoji = emojis[_id]?.[0];

    const id = unicodeEmoji ? null : await tryToSnowflake(_id);
    const emojiName = unicodeEmoji ? _id : name;

    return {
      name: emojiName,
      id,
      animated: animated ?? false,
      require_colons: !unicodeEmoji,
    };
  },
};

export const Emoji: QuarkConversion<API.Emoji, APIEmoji, EmojiATQ, EmojiAFQ> = {
  async to_quark(emoji) {
    return PartialEmoji.to_quark(emoji);
  },

  async from_quark(emoji, extra) {
    const partial = await PartialEmoji.from_quark(emoji);

    return {
      ...partial,
      available: true,
      roles: [],
      user: extra?.discordUser
        ? extra.discordUser
        : await User.from_quark(extra?.user ?? {
          _id: emoji.creator_id,
          username: "fixme",
        }),
    };
  },
};

export interface discordGatewayGuildEmoji extends APIEmoji {
  guildId: string | null;
  allNamesString: string;
}

export function createGatewayGuildEmoji(
  emoji: APIEmoji,
  guildId?: string,
): discordGatewayGuildEmoji {
  return {
    ...emoji,
    managed: false,
    allNamesString: `:${emoji.name}:`,
    guildId: guildId ?? null,
  };
}

// Sent in the gateway READY event underneath the "emojis" object in a guild
export const GatewayGuildEmoji: QuarkConversion<
API.Emoji, discordGatewayGuildEmoji, EmojiATQ, EmojiAFQ
> = {
  async to_quark(emoji, extra) {
    return Emoji.to_quark(emoji, extra);
  },

  async from_quark(emoji, extra) {
    const discordEmoji = await Emoji.from_quark(emoji, extra);

    const guildId = emoji.parent.type === "Server" ? await toSnowflake(emoji.parent.id) : undefined;

    return createGatewayGuildEmoji(discordEmoji, guildId);
  },
};

export type ReactionsATQ = {};
export type ReactionsAFQ = Partial<{
  selfId: string | null,
  creatorId: string | null,
}>;

export const Reactions: QuarkConversion<API.Message["reactions"]
, APIReaction[], ReactionsATQ, ReactionsAFQ> = {
  async to_quark(reaction) {
    return {};
  },

  async from_quark(reactions, extra) {
    if (!reactions) return [];

    const reactionEntries = Object.entries(reactions);

    const discordEmojis = await Promise.all(reactionEntries
      .map(([value, key]) => PartialEmoji.from_quark({
        _id: value,
        creator_id: extra?.creatorId ?? "0",
        parent: {
          type: "Detached",
        },
        name: "fixme",
      })));

    return Promise.all(discordEmojis.map(async (x) => {
      const emojiId = x.id ? await tryFromSnowflake(x.id) : null;
      const reaction = reactionEntries
        .find(([em, k]) => (emojiId ? emojiId === em : x.name === em));
      const reactedUsers = reaction?.[1];

      // FIXME: ugly ugly ugly ew ew ew
      return {
        count: reactedUsers?.length ?? 0,
        emoji: x,
        burst_user_ids: [],
        burst_count: 0,
        burst_colors: [],
        burst_me: false,
        me: extra?.selfId ? reactedUsers?.includes(extra.selfId) ?? false : false,
      };
    }));
  },
};
