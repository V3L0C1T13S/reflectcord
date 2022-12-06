/* eslint-disable camelcase */
import { APIMessage, RESTPostAPIChannelMessageJSONBody } from "discord.js";
import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import {
  validate,
} from "@reflectcord/common/utils";
import {
  fromSnowflake,
  Message, MessageSendData,
} from "@reflectcord/common/models";

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
      // FIXME: Implementing with fetch can cause 404's if the user is deleted
      const mentions = x.mentions?.map((id) => msgs.users.find((u) => u._id === id)!)
        .filter((u) => u);

      return Message.from_quark(x, {
        user: user ?? null,
        mentions,
      });
    }));

    return res.json(convMessages);
  },
  post: {
    // middleware: validate({ body: "MessageCreateSchema" }),
    handler: async (req: sendReq, res: Response<APIMessage>) => {
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
  },
};
