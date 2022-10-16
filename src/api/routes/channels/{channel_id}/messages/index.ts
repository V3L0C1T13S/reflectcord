/* eslint-disable camelcase */
import { Application, Request } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Message } from "../../../../../common/models";

export default (express: Application) => <Resource> {
  get: async (req: Request<any, any, any, { limit: string }>, res) => {
    const limit = parseInt(req.query.limit ?? "50", 10);
    const { channel_id } = req.params;

    const msgs = await res.rvAPI.get(`/channels/${channel_id}/messages`, {
      limit,
    }) as API.Message[];
    if (!msgs) return;

    return res.json(await Promise.all(msgs.map((m) => Message.from_quark(m))));
  },
  post: async (req, res) => {
    const { channel_id } = req.params;
    const { content } = req.body;

    const revoltResponse = await res.rvAPI.post(`/channels/${channel_id}/messages`, {
      content,
    }) as API.Message;
    if (!revoltResponse) return;

    return res.json(await Message.from_quark(revoltResponse));
  },
};
