/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Message } from "../../../../../common/models";
import { createAPI } from "../../../../../common/rvapi";

export default (express: Application) => <Resource> {
  post: async (req, res) => {
    const { channel_id } = req.params;
    const { content } = JSON.parse(req.body.payload_json);

    const api = createAPI(req.token);

    const revoltResponse = await api.post(`/channels/${channel_id}/messages`, {
      content,
    }).catch(() => {
      res.sendStatus(500);
    }) as API.Message;
    if (!revoltResponse) return;

    return res.json(await Message.from_quark(revoltResponse));
  },
};
