/* eslint-disable camelcase */
import { APIMessage } from "discord.js";
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { fromSnowflake } from "../../../../../../common/models/util";
import { Message, MessageSendData, User } from "../../../../../../common/models";
import { HTTPError } from "../../../../../../common/utils";
import { sendReq } from "..";

export default (express: Application) => <Resource> {
  get: async (req, res: Response<APIMessage>) => {
    const { channel_id, message_id } = req.params;

    if (!channel_id || !message_id) throw new HTTPError("Malformed body", 244);

    const rvChannel = await fromSnowflake(channel_id);
    const rvMsgId = await fromSnowflake(message_id);

    const message = await res.rvAPIWrapper.messages.getMessage(rvChannel, rvMsgId);

    return res.json(message.discord);
  },
  patch: async (req: sendReq, res) => {
    const { channel_id, message_id } = req.params;

    if (!channel_id || !message_id) throw new HTTPError("Malformed body", 244);

    const rvChannel = await fromSnowflake(channel_id);
    const rvMsgId = await fromSnowflake(message_id);

    const patchData = await MessageSendData.to_quark(req.body);

    const rvMessage = await res.rvAPI.patch(`/channels/${rvChannel}/messages/${rvMsgId}`, {
      content: patchData.content ? patchData.content : null,
      embeds: patchData.embeds ? patchData.embeds : null,
    }) as API.Message;

    return res.json(await Message.from_quark(rvMessage));
  },
};
