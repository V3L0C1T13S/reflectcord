/* eslint-disable camelcase */
import { APIMessage, RESTPostAPIChannelMessageJSONBody } from "discord.js";
import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import {
  fromSnowflake,
  Message, MessageSendData, User,
} from "@reflectcord/common/models";
import {
  Logger, validateBody,
} from "@reflectcord/common/utils";
import { MessageCreateSchema } from "@reflectcord/common/sparkle";

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
    });

    if (!("messages" in msgs)) {
      Logger.warn("API gave an incorrect messages response! Is your Revolt instance up to date?");
      return res.json(await Promise.all(msgs.map((x) => Message.from_quark(x))));
    }

    const convMessages = await Promise.all(msgs.messages.map(async (x) => {
      const user = msgs.users.find((u) => x.author === u._id);
      // FIXME: Implementing with fetch can cause 404's if the user is deleted
      const mentions = x.mentions?.map((id) => msgs.users.find((u) => u._id === id)!)
        .filter((u) => !!u);

      if (user) {
        res.rvAPIWrapper.users.createObj({
          revolt: user,
          discord: await User.from_quark(user),
        });
      }

      return (await res.rvAPIWrapper.messages.convertMessageObj(x, {
        mentions: false,
      }, {
        // user,
        mentions,
      })).discord;
    }));

    return res.json(convMessages);
  },
  post: {
    handler: async (req: sendReq, res: Response<APIMessage>) => {
      const { channel_id } = req.params;

      if (req.body.payload_json) {
        req.body = JSON.parse(req.body.payload_json);
      }

      validateBody(MessageCreateSchema, req.body);

      const rvId = await fromSnowflake(channel_id);

      // eslint-disable-next-line no-self-compare
      const files = req.files?.length ?? 0 > 0 ? req.files : req.body.attachments;

      const msg = await res.rvAPIWrapper.messages.sendMessage(
        rvId,
        await MessageSendData.to_quark(req.body, {
          // @ts-ignore
          files,
        }),
      );

      res.json(msg.discord);
    },
  },
};
