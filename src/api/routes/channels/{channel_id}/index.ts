/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Channel } from "../../../../common/models";
import { HTTPError } from "../../../../common/utils";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const { channel_id } = req.params;

    const rvChannel = await res.rvAPI.get(`/channels/${channel_id}`) as API.Channel;
    if (!rvChannel) throw new HTTPError("Channel does not exist");

    return res.json(await Channel.from_quark(rvChannel));
  },
};
