/* eslint-disable no-restricted-syntax */
/* eslint-disable camelcase */
import {
  APIMessage,
  APIUser,
  MessageReference as DiscordMessageReference,
  MessageType,
  RESTPostAPIChannelMessageJSONBody,
} from "discord.js";
import fileUpload from "express-fileupload";
import { Message as RevoltMessage } from "revolt-api";
import { API } from "revolt.js";
import { decodeTime } from "ulid";
import { QuarkConversion } from "../QuarkConversion";
import { fromSnowflake, toSnowflake } from "../util";
import { Attachment } from "./attachment";
import { Embed, SendableEmbed } from "./embed";
import { Reactions } from "./emoji";
import { User } from "./user";
import { uploadFile } from "../../../cdn/util";

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
  server?: string,
}

export type MessageATQ = {};

export type MessageAFQ = Partial<{
  user: API.User | null | undefined,
}>

export const MessageReference: QuarkConversion<
  messageReferenceRevolt,
  DiscordMessageReference
> = {
  async to_quark(reference) {
    return {
      id: reference.messageId ?? "0",
      channel_id: reference.channelId,
    };
  },

  async from_quark(reference) {
    return {
      messageId: await toSnowflake(reference.id),
      channelId: await toSnowflake(reference.channel_id),
      guildId: reference.server ? await toSnowflake(reference.server) : undefined,
    };
  },
};

export const Message: QuarkConversion<RevoltMessage, APIMessage, MessageATQ, MessageAFQ> = {
  async to_quark(message) {
    const {
      content, id, author, embeds, channel_id, attachments, message_reference,
    } = message;

    return {
      _id: id,
      content,
      author: author.id,
      channel: channel_id,
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
        username: masquerade?.name ?? "fixme",
      }, {
        masquerade,
      });

    const channel_id = await toSnowflake(channel);

    const reply = replies?.[0] ?? null;

    const discordMessage: APIMessage = {
      id: (await toSnowflake(_id)).toString(),
      channel_id,
      content: content ?? "fixme",
      author: await (async () => {
        if (message.system) {
          if (
            message.system.type === "user_added"
            || message.system.type === "user_remove"
            || message.system.type === "user_kicked"
            || message.system.type === "user_banned"
          ) {
            return {
              id: await toSnowflake(message.system.id),
              username: "System",
              discriminator: "1",
              avatar: null,
            };
          }
        }

        return authorUser;
      })(),
      timestamp: new Date(decodeTime(_id)).toISOString(),
      edited_timestamp: message.edited ?? null,
      tts: false,
      mention_everyone: false,
      mentions: mentions ? await Promise.all(mentions.map((x) => User.from_quark({
        _id: x,
        username: "fixme",
      }))) : [],
      attachments: attachments
        ? await Promise.all(attachments.map((x) => Attachment.from_quark(x)))
        : [],
      mention_roles: [],
      embeds: embeds
        ? await Promise.all(embeds.map((x) => Embed.from_quark(x)))
        : [],
      pinned: false,
      type: (() => {
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

    if (reply) {
      // FIXME: Missing guild id
      discordMessage.message_reference = {
        message_id: await toSnowflake(reply),
        channel_id,
      };
    }

    if (message.nonce) discordMessage.nonce = message.nonce;

    if (message.system) {
      switch (message.system.type) {
        case "text": {
          discordMessage.content = message.system.content;
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
        default: {
          break;
        }
      }
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

    return {
      content: content ?? " ",
      embeds: embeds ? await Promise.all(embeds.map((x) => SendableEmbed.to_quark(x))) : null,
      replies: message_reference ? [{
        id: await fromSnowflake(message_reference.message_id),
        mention: data.allowed_mentions?.replied_user ?? false,
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
