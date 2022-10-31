/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { fromSnowflake } from "../../../../common/models/util";
import { Channel } from "../../../../common/models";
import { HTTPError } from "../../../../common/utils";

export async function getChannel(api: API.API, id: string) {
  const rvChannel = await api.get(`/channels/${id}`) as API.Channel;

  return rvChannel;
}

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const { channel_id } = req.params;
    if (!channel_id) throw new HTTPError("Maformed request", 244);

    const rvId = await fromSnowflake(channel_id);

    const rvChannel = await getChannel(res.rvAPI, rvId);

    res.json(await Channel.from_quark(rvChannel));
  },
  patch: async (req, res) => {
    const { channel_id } = req.params;
    const { name, topic, nsfw } = req.body;
    if (!channel_id) throw new HTTPError("Maformed request", 244);

    const rvId = await fromSnowflake(channel_id);
    const rvChannel = await res.rvAPI.patch(`/channels/${rvId as ""}`, {
      name,
      description: topic ?? null,
      nsfw,
    });

    res.json(await Channel.from_quark(rvChannel));
  },
};
