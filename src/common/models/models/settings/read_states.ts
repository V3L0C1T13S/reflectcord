/* eslint-disable camelcase */
import { API } from "revolt.js";
import { toSnowflake } from "@reflectcord/common/models";
import { QuarkConversion } from "../../QuarkConversion";
import { fromSnowflake } from "../../util";
import { ReadStateObject } from "../../../sparkle";

export const ReadState: QuarkConversion<API.ChannelUnread, ReadStateObject> = {
  async to_quark(state) {
    const {
      id, last_message_id, last_pin_timestamp, mention_count,
    } = state;

    return {
      _id: {
        channel: await fromSnowflake(id),
        user: "0",
      },
      last_id: last_message_id ? await fromSnowflake(last_message_id) : null,
      mentions: [],
    };
  },

  async from_quark(state) {
    const { _id, last_id, mentions } = state;

    return {
      id: await toSnowflake(_id.channel),
      last_message_id: last_id ? await toSnowflake(last_id) : null,
      last_pin_timestamp: null,
      mention_count: mentions?.length ?? 0,
    };
  },
};
