/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { createAPI } from "../../../../common/rvapi";
import { Channel } from "../../../../common/models";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const { channel_id } = req.params;

    if (!channel_id) return res.sendStatus(504);

    const api = createAPI(req.token);

    const rvChannel = await api.get(`/channels/${channel_id}`) as API.Channel;

    return res.json(await Channel.from_quark(rvChannel));
  },
};
