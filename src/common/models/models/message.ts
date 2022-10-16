/* eslint-disable camelcase */
import { APIMessage, APIUser, MessageType } from "discord.js";
import { ChannelUnread, Message as RevoltMessage } from "revolt-api";
import { decodeTime } from "ulid";
import { QuarkConversion } from "../QuarkConversion";

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
      content, id, author, embeds, channel_id,
    } = message;

    return {
      _id: id,
      content,
      author: author.id,
      channel: channel_id,
    };
  },

  async from_quark(message) {
    const {
      _id, channel, content, author,
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
      attachments: [],
      mention_roles: [],
      embeds: [],
      pinned: false,
      type: MessageType.Default,
    };
  },
};
