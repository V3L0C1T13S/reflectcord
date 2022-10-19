/* eslint-disable camelcase */
import {
  APIMessage, APIUser, MessageType, RESTPostAPIChannelMessageJSONBody,
} from "discord.js";
import { Message as RevoltMessage } from "revolt-api";
import { API } from "revolt.js";
import { decodeTime } from "ulid";
import { QuarkConversion } from "../QuarkConversion";
import { fromSnowflake, toSnowflake } from "../util";
import { Attachment } from "./attachment";
import { Embed, SendableEmbed } from "./embed";
import { User } from "./user";

export type APIMention = {
  id: string,
  type: number,
  content: string,
  channel_id: string,
  author: APIUser,
};

export const Message: QuarkConversion<RevoltMessage, APIMessage> = {
  async to_quark(message) {
    const {
      content, id, author, embeds, channel_id, attachments,
    } = message;

    return {
      _id: id,
      content,
      author: author.id,
      channel: channel_id,
      embeds: await Promise.all(embeds.map((x) => Embed.to_quark(x))),
      attachments: await Promise.all(attachments.map((x) => Attachment.to_quark(x))),
    };
  },

  async from_quark(message) {
    const {
      _id, channel, content, author, attachments, embeds,
    } = message;

    const authorUser = await User.from_quark({
      _id: author,
      username: "fixme",
    });

    return {
      id: (await toSnowflake(_id)).toString(),
      channel_id: await toSnowflake(channel),
      content: content ?? "fixme",
      author: (() => {
        if (message.system) {
          if (message.system.type === "user_added" || message.system.type === "user_remove") {
            return {
              id: message.system.id,
              username: "fixme",
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
      mentions: [],
      attachments: attachments
        ? await Promise.all(attachments.map((x) => Attachment.from_quark(x)))
        : [],
      mention_roles: [],
      embeds: embeds
        ? await Promise.all(embeds.map((x) => Embed.from_quark(x)))
        : [],
      pinned: false,
      type: MessageType.Default,
    };
  },
};

export const MessageSendData: QuarkConversion<
  API.DataMessageSend,
  RESTPostAPIChannelMessageJSONBody
> = {
  async to_quark(data) {
    const { content, embeds } = data;

    return {
      content: content ?? " ",
      embeds: embeds ? await Promise.all(embeds.map((x) => SendableEmbed.to_quark(x))) : null,
    };
  },

  async from_quark(data) {
    const { content, embeds } = data;

    return {
      content: content ?? "** **",
      embeds: embeds
        ? await Promise.all(embeds.map((x) => SendableEmbed.from_quark(x)))
        : undefined,
    };
  },
};
