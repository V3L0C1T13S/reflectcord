/* eslint-disable no-restricted-syntax */
/* eslint-disable camelcase */
import {
  APIMessage,
  APIMessageReference,
  APIUser,
  MessageType,
  RESTPostAPIChannelMessageJSONBody,
} from "discord.js";
import fileUpload from "express-fileupload";
import { Message as RevoltMessage } from "revolt-api";
import { API } from "revolt.js";
import { decodeTime } from "ulid";
import { uploadFile } from "@reflectcord/cdn/util";
import { systemUserID } from "@reflectcord/common/rvapi";
import { QuarkConversion } from "../QuarkConversion";
import {
  fromSnowflake, toSnowflake, tryFromSnowflake, tryToSnowflake,
} from "../util";
import { Attachment } from "./attachment";
import { Embed, SendableEmbed } from "./embed";
import { Reactions } from "./emoji";
import { User } from "./user";
import {
  CHANNEL_MENTION, REVOLT_CHANNEL_MENTION, REVOLT_USER_MENTION,
  USER_MENTION, EMOJI_REGEX, REVOLT_EMOJI_REGEX, isOnlyEmoji, REVOLT_ULID, SNOWFLAKE,
} from "../../utils";

async function replaceAsync(
  str: string,
  regex: RegExp,
  asyncFn: (match: string) => Promise<string>,
): Promise<string> {
  const promises = (str.match(regex) ?? []).map((match: string) => asyncFn(match));
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift()!);
}

export type APIMention = {
  id: string,
  type: number,
  content: string,
  channel_id: string,
  author: APIUser,
};

type messageReferenceRevolt = {
  id: string,
  channel_id: string,
  server?: string | null | undefined,
}

export type MessageATQ = {};

export type MessageAFQ = Partial<{
  user: API.User | null | undefined,
  mentions: API.User[] | null | undefined,
  server: string | null,
  api_version: number,
}>

export const MessageReference: QuarkConversion<
  messageReferenceRevolt,
  APIMessageReference
> = {
  async to_quark(reference) {
    const revoltRef: messageReferenceRevolt = {
      id: reference.message_id ? await fromSnowflake(reference.message_id) : "0",
      channel_id: await fromSnowflake(reference.channel_id),
      server: reference.guild_id ? await toSnowflake(reference.guild_id) : null,
    };

    return revoltRef;
  },

  async from_quark(reference) {
    const discordRef: APIMessageReference = {
      message_id: await toSnowflake(reference.id),
      channel_id: await toSnowflake(reference.channel_id),
    };

    if (reference.server) discordRef.guild_id = await toSnowflake(reference.server);

    return discordRef;
  },
};

export const Message: QuarkConversion<RevoltMessage, APIMessage, MessageATQ, MessageAFQ> = {
  async to_quark(message) {
    const {
      content, id, author, embeds, channel_id, attachments, message_reference,
    } = message;

    return {
      _id: await fromSnowflake(id),
      content: content?.replace(/\|\|(([\w\s])+)\|\|/g, "!!$1!!"),
      author: await fromSnowflake(author.id),
      channel: await fromSnowflake(channel_id),
      embeds: await Promise.all(embeds.map((x) => Embed.to_quark(x))),
      attachments: await Promise.all(attachments.map((x) => Attachment.to_quark(x))),
      replies: message_reference?.message_id
        ? [message_reference.message_id]
        : null,
    };
  },

  async from_quark(message, extra) {
    const {
      _id, channel, content, author, attachments, embeds, reactions, replies, mentions, masquerade,
    } = message;

    const authorUser = extra?.user
      ? await User.from_quark(extra.user, {
        masquerade,
      })
      : await User.from_quark({
        _id: author,
        username: "fixme",
      }, {
        masquerade,
      });

    const channel_id = await toSnowflake(channel);

    const reply = replies?.[0] ?? null;

    const discordMessage: APIMessage = {
      id: await toSnowflake(_id),
      channel_id,
      content: content?.replace(/\|\|.+\|\|/gs, (match) => `\\${match}`)
      // Translate !!Revite spoilers!! to ||Discord spoilers||
        .replace(
          /!!.+!!/g,
          (match) => `||${match.substring(2, match.length - 2)}||`,
        ) ?? "",
      author: await (async () => {
        if (message.author === systemUserID) {
          if (message.system) {
            if (
              message.system.type === "user_kicked"
            || message.system.type === "user_banned"
            || message.system.type === "user_joined"
            ) {
              return {
                id: await toSnowflake(message.system.id),
                username: "System",
                discriminator: "1",
                avatar: null,
              };
            }
            if (message.system.type === "user_added" || message.system.type === "user_remove") {
              return authorUser;
            }
            if (message.system.type === "channel_renamed") {
              return {
                id: await toSnowflake(message.system.by),
                username: "System",
                discriminator: "1",
                avatar: null,
              };
            }
          }
        }

        return authorUser;
      })(),
      timestamp: new Date(decodeTime(_id)).toISOString(),
      edited_timestamp: message.edited ?? null,
      tts: false,
      mention_everyone: false,
      mentions: mentions ? await Promise.all(
        extra?.mentions
          ?.map((x) => User.from_quark(x)) ?? mentions.map((x) => User.from_quark({
          _id: x,
          username: "fixme",
        })),
      ) : [],
      attachments: attachments
        ? await Promise.all(attachments.map((x) => Attachment.from_quark(x)))
        : [],
      mention_roles: [],
      embeds: embeds
        ? await Promise.all(embeds.map((x) => Embed.from_quark(x)))
        : [],
      pinned: false,
      type: (() => {
        if (extra?.api_version && extra?.api_version < 7) {
          return MessageType.Default;
        }

        if (reply) {
          return MessageType.Reply;
        }

        if (message.system) {
          switch (message.system.type) {
            case "user_joined": {
              return MessageType.UserJoin;
            }
            case "user_added": {
              return MessageType.RecipientAdd;
            }
            case "user_remove": {
              return MessageType.RecipientRemove;
            }
            case "channel_renamed": {
              return MessageType.ChannelNameChange;
            }
            case "channel_icon_changed": {
              return MessageType.ChannelIconChange;
            }
            default: {
              return MessageType.Default;
            }
          }
        }

        return MessageType.Default;
      })(),
      reactions: await Reactions.from_quark(reactions),
    };

    if (masquerade?.name) {
      discordMessage.webhook_id = "0";
      discordMessage.application_id = discordMessage.author.id;
      discordMessage.author.discriminator = "0000";
    }

    if (reply) {
      discordMessage.message_reference = await MessageReference.from_quark({
        id: reply,
        channel_id: message.channel,
        server: extra?.server,
      });
    }

    if (message.nonce) discordMessage.nonce = await tryToSnowflake(message.nonce);

    if (message.system) {
      switch (message.system.type) {
        case "text": {
          discordMessage.content = message.system.content;
          break;
        }
        case "user_added": {
          discordMessage.mentions.push(await User.from_quark({
            _id: message.system.by,
            username: "fixme",
          }));

          break;
        }
        case "user_left": {
          discordMessage.content = `<@${await toSnowflake(message.system.id)}> left.`;
          break;
        }
        case "user_banned": {
          discordMessage.content = `<@${await toSnowflake(message.system.id)}> was banned.`;
          break;
        }
        case "user_kicked": {
          discordMessage.content = `<@${await toSnowflake(message.system.id)}> was kicked.`;
          break;
        }
        case "channel_renamed": {
          discordMessage.content = message.system.name;
          break;
        }
        default: {
          break;
        }
      }
    } else {
      discordMessage.content = await replaceAsync(
        discordMessage.content,
        REVOLT_CHANNEL_MENTION,
        async (match) => `<#${await tryToSnowflake(match.substring(2, match.length - 1))}>`,
      );

      discordMessage.content = await replaceAsync(
        discordMessage.content,
        REVOLT_USER_MENTION,
        async (match) => `<@${await tryToSnowflake(match.substring(2, match.length - 1))}>`,
      );

      discordMessage.content = await replaceAsync(
        discordMessage.content,
        REVOLT_EMOJI_REGEX,
        async (match) => {
          if (!isOnlyEmoji(match)) return match;

          const emojiId = match.substring(1, match.length - 1);
          if (!REVOLT_ULID.test(emojiId)) return match;

          return `<a:fixme:${await toSnowflake(emojiId)}>`;
        },
      );
    }

    return discordMessage;
  },
};

export type MessageSendDataATQ = {
  files?: fileUpload.FileArray | null | undefined,
}

export const MessageSendData: QuarkConversion<
  API.DataMessageSend,
  RESTPostAPIChannelMessageJSONBody,
  MessageSendDataATQ
> = {
  async to_quark(data, extra) {
    const { content, embeds, message_reference } = data;

    const sendData: API.DataMessageSend = {
      content: content?.replace(
        /!!.+!!/g,
        (match) => `!\u200b!${match.substring(2, match.length - 2)}!!`,
      )
      // Translate ||Discord spoilers|| to !!Revite spoilers!!,
      // while making sure multiline spoilers continue working
        .replace(/\|\|.+\|\|/gs, (match) => match
          .substring(2, match.length - 2)
          .split("\n")
          .map((line) => `!!${line.replace(/!!/g, "!\u200b!")}!!`)
          .join("\n")) ?? " ",
      embeds: embeds ? await Promise.all(embeds.map((x) => SendableEmbed.to_quark(x))) : null,
      replies: message_reference ? [{
        id: await fromSnowflake(message_reference.message_id),
        // Discord documentation is wrong. This defaults to true.
        mention: data.allowed_mentions?.replied_user ?? true,
      }] : null,
      nonce: data.nonce?.toString() ?? null,
      attachments: extra?.files ? (await Promise.all(Object.values(extra.files)
        .map(async (x) => {
          const file = Array.isArray(x) ? x?.[0] : x;
          if (!file) return;

          const id = await uploadFile("attachments", {
            name: file.name,
            file: file.data,
          }, file.mimetype);

          return id;
        }))).filter((x) => x) as string[] : null,
    };

    if (sendData.content) {
      sendData.content = await replaceAsync(
        sendData.content,
        CHANNEL_MENTION,
        async (match) => `<#${await tryFromSnowflake(match.substring(2, match.length - 1))}>`,
      );

      sendData.content = await replaceAsync(
        sendData.content,
        USER_MENTION,
        async (match) => `<@${await tryFromSnowflake(match.substring(2, match.length - 1))}>`,
      );

      sendData.content = await replaceAsync(
        sendData.content,
        EMOJI_REGEX,
        async (match) => {
          const id = match.match(/(<a?)?:\w+:/g)?.[0];
          if (!id) return match;

          if (!SNOWFLAKE.test(id)) return match;

          return `:${await tryFromSnowflake(id.substring(0, id.length - 1))}:`;
        },
      );
    }

    return sendData;
  },

  async from_quark(data) {
    const { content, embeds, replies } = data;

    const reply = replies?.[0] ?? null;

    return {
      content: content ?? "** **",
      embeds: embeds
        ? await Promise.all(embeds.map((x) => SendableEmbed.from_quark(x)))
        : undefined,
      nonce: data.nonce ?? undefined,
    };
  },
};
