/* eslint-disable camelcase */
import { APIMessage } from "discord.js";
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Message } from "../../../../../../common/models";

export default (express: Application) => <Resource> {
  get: async (req, res: Response<APIMessage>) => {
    const { channel_id, message_id } = req.params;

    const rvMessage = await res.rvAPI.get(`/channels/${channel_id}/messages/${message_id}`)
      .catch(() => {
        res.sendStatus(500);
      }) as API.Message;
    if (!rvMessage) return;

    return res.json(await Message.from_quark(rvMessage));
  },
};
