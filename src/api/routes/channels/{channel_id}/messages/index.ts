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

export type sendReq = Request<any, any, RESTPostAPIChannelMessageJSONBody>;

export type rvMsgWithUsers = {
  messages: API.Message[];
  users: API.User[];
  members: API.Member[];
}

export default (express: Application) => <Resource> {
  get: async (req: Request<any, any, any, { limit: string, before: string }>, res) => {
    const limit = parseInt(req.query.limit ?? "50", 10);
    const { before } = req.query;
    const { channel_id } = req.params;

    const rvId = await fromSnowflake(channel_id);

    const msgs = await res.rvAPI.get(`/channels/${rvId}/messages`, {
      limit,
      include_users: true,
    }) as rvMsgWithUsers;
    if (!msgs) return;

    const convMessages = await Promise.all(msgs.messages.map(async (x) => {
      const user = msgs.users.find((u) => x.author === u._id);
      const msg = await Message.from_quark(x);

      return {
        ...msg,
        author: user ? await User.from_quark(user) : msg.author,
      };
    }));

    return res.json(convMessages);
  },
  post: async (req: sendReq, res: Response<APIMessage>) => {
    const { channel_id } = req.params;

    const rvId = await fromSnowflake(channel_id);

    const msg = await res.rvAPIWrapper.messages.sendMessage(
      rvId,
      await MessageSendData.to_quark(req.body),
    );

    return res.json(msg.discord);
  },
};
