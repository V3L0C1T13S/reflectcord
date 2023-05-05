/* eslint-disable camelcase */
import { APIMessage } from "discord.js";
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import {
  fromSnowflake, Message, MessageSendData,
} from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";
import { messageFullMentions } from "@reflectcord/common/constants";
import { sendReq } from "..";

export default () => <Resource> {
  get: async (req, res: Response<APIMessage>) => {
    const { channel_id, message_id } = req.params;

    if (!channel_id || !message_id) throw new HTTPError("Malformed body", 422);

    const rvChannel = await fromSnowflake(channel_id);
    const rvMsgId = await fromSnowflake(message_id);

    const message = await res.rvAPIWrapper.messages.getMessage(rvChannel, rvMsgId);
    if (messageFullMentions) {
      const mentions = message.revolt.message.mentions
        ? (await Promise.all(message.revolt.message.mentions
          .map(async (x) => {
            try {
              const user = await res.rvAPIWrapper.users.fetch(x);
              return user;
            } catch {
              return;
            }
          }))).filter((x): x is any => !!x)
        : null;

      if (mentions) message.discord.mentions = mentions;
    }

    return res.json(message.discord);
  },
  patch: async (req: sendReq, res) => {
    const { channel_id, message_id } = req.params;

    if (!channel_id || !message_id) throw new HTTPError("Malformed body", 422);

    const rvChannel = await fromSnowflake(channel_id);
    const rvMsgId = await fromSnowflake(message_id);

    const patchData = await MessageSendData.to_quark(req.body);

    const rvMessage = await res.rvAPIWrapper.messages.editMessage(
      rvChannel,
      rvMsgId,
      patchData,
      { fixEmbedComponentUpdate: true },
    );

    return res.json(await Message.from_quark(rvMessage));
  },
  delete: async (req, res) => {
    const { channel_id, message_id } = req.params;

    if (!channel_id || !message_id) throw new HTTPError("Malformed body", 422);

    const rvChannel = await fromSnowflake(channel_id);
    const rvMsgId = await fromSnowflake(message_id);

    await res.rvAPIWrapper.messages.deleteMessage(rvChannel, rvMsgId);

    res.sendStatus(204);
  },
};
