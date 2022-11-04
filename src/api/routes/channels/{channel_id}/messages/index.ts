/* eslint-disable camelcase */
import { APIMessage, RESTPostAPIChannelMessageJSONBody } from "discord.js";
import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { fromSnowflake } from "../../../../../common/models/util";
import {
  Message, MessageSendData, SendableEmbed, User,
} from "../../../../../common/models";
import { HTTPError } from "../../../../../common/utils";

export type sendReq = Request<any, any, RESTPostAPIChannelMessageJSONBody & { payload_json: any }>;

export type rvMsgWithUsers = {
  messages: API.Message[];
  users: API.User[];
  members: API.Member[];
}

export default (express: Application) => <Resource> {
  get: async (req: Request<any, any, any, {
    limit: string, before: string, after: string, around: string
  }>, res) => {
    const limit = parseInt(req.query.limit ?? "50", 10);
    const { before, after, around } = req.query;
    const { channel_id } = req.params;

    const beforeId = before ? await fromSnowflake(before) : null;
    const afterId = after ? await fromSnowflake(after) : null;
    const aroundId = around ? await fromSnowflake(around) : null;

    const rvId = await fromSnowflake(channel_id);

    const msgs = await res.rvAPI.get(`/channels/${rvId as ""}/messages`, {
      limit,
      include_users: true,
      before: beforeId,
      after: afterId,
      nearby: aroundId,
    }) as rvMsgWithUsers;

    const convMessages = await Promise.all(msgs.messages.map(async (x) => {
      const user = msgs.users.find((u) => x.author === u._id);
      // FIME: there has to be a more efficient way of doing this
      const mentions = x.mentions ? await Promise.all(x.mentions
        ?.map(async (m) => {
          const mentionedUser = msgs.users.find((u) => u._id === m)
            ?? (await res.rvAPIWrapper.users.fetch(m)).revolt;

          return mentionedUser;
        })) : null;

      return Message.from_quark(x, {
        user: user ?? null,
        mentions,
      });
    }));

    return res.json(convMessages);
  },
  post: async (req: sendReq, res: Response<APIMessage>) => {
    const { channel_id } = req.params;

    if (req.body.payload_json) {
      req.body = JSON.parse(req.body.payload_json);
    }

    const rvId = await fromSnowflake(channel_id);

    const msg = await res.rvAPIWrapper.messages.sendMessage(
      rvId,
      await MessageSendData.to_quark(req.body, {
        files: req.files,
      }),
    );

    return res.json(msg.discord);
  },
};
