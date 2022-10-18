/* eslint-disable camelcase */
import { APIMessage } from "discord.js";
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { fromSnowflake } from "../../../../../../common/models/util";
import { Message } from "../../../../../../common/models";
import { HTTPError } from "../../../../../../common/utils";

export default (express: Application) => <Resource> {
  get: async (req, res: Response<APIMessage>) => {
    const { channel_id, message_id } = req.params;

    if (!channel_id || !message_id) throw new HTTPError("Malformed body", 244);

    const rvChannel = await fromSnowflake(channel_id);
    const rvMsgId = await fromSnowflake(message_id);

    const rvMessage = await res.rvAPI.get(`/channels/${rvChannel}/messages/${rvMsgId}`) as API.Message;

    return res.json(await Message.from_quark(rvMessage));
  },
  patch: async (req, res) => {
    const { channel_id, message_id } = req.params;

    if (!channel_id || !message_id) throw new HTTPError("Malformed body", 244);

    const rvChannel = await fromSnowflake(channel_id);
    const rvMsgId = await fromSnowflake(message_id);

    const rvMessage = await res.rvAPI.get(`/channels/${rvChannel}/messages/${rvMsgId}`) as API.Message;

    return res.json(await Message.from_quark(rvMessage));
  },
};
