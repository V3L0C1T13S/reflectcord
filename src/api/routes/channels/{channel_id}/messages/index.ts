/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Message } from "../../../../../common/models";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const { channel_id } = req.params;

    const msgs = await res.rvAPI.get(`/channels/${channel_id}/messages`)
      .catch(() => {
        res.sendStatus(500);
      }) as any;
    if (!msgs) return;

    return res.json([]);
  },
  post: async (req, res) => {
    const { channel_id } = req.params;
    const { content } = JSON.parse(req.body.payload_json);

    const revoltResponse = await res.rvAPI.post(`/channels/${channel_id}/messages`, {
      content,
    }).catch(() => {
      res.sendStatus(500);
    }) as API.Message;
    if (!revoltResponse) return;

    return res.json(await Message.from_quark(revoltResponse));
  },
};
