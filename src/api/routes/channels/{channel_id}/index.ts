/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { createAPI } from "../../../../common/rvapi";
import { Channel } from "../../../../common/models";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const { channel_id } = req.params;

    if (!channel_id) return res.sendStatus(422);

    const rvChannel = await res.rvAPI.get(`/channels/${channel_id}`).catch(() => {
      res.sendStatus(500);
    }) as API.Channel;
    if (!rvChannel) return;

    return res.json(await Channel.from_quark(rvChannel));
  },
};
