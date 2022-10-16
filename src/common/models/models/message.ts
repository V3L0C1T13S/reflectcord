/* eslint-disable camelcase */
import { APIMessage, APIUser, MessageType } from "discord.js";
import { Message as RevoltMessage } from "revolt-api";
import { decodeTime } from "ulid";
import { QuarkConversion } from "../QuarkConversion";
import { Attachment } from "./attachment";
import { Embed } from "./embed";

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

    return {
      id: _id,
      channel_id: channel,
      content: content ?? "fixme",
      author: (() => {
        if (message.system) {
          if (message.system.type === "user_added" || message.system.type === "user_remove") {
            return {
              id: message.system.by,
              username: "fixme",
              discriminator: "1",
              avatar: null,
            };
          }
        }
        return {
          id: author,
          username: "fixme",
          discriminator: "1",
          avatar: null,
        };
      })(),
      timestamp: decodeTime(_id).toString(),
      edited_timestamp: null,
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
