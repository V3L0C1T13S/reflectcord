/* eslint-disable camelcase */
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { fromSnowflake, Channel } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";
import { APIChannel } from "discord.js";

export async function getChannel(api: API.API, id: string) {
  const rvChannel = await api.get(`/channels/${id}`) as API.Channel;

  return rvChannel;
}

export default (express: Application) => <Resource> {
  get: async (req, res: Response<APIChannel>) => {
    const { channel_id } = req.params;
    if (!channel_id) throw new HTTPError("Maformed request", 244);

    const rvId = await fromSnowflake(channel_id);

    const rvChannel = await getChannel(res.rvAPI, rvId);

    res.json(await Channel.from_quark(rvChannel));
  },
  patch: async (req, res: Response<APIChannel>) => {
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
  delete: async (req, res: Response<APIChannel>) => {
    const { channel_id } = req.params;
    if (!channel_id) throw new HTTPError("Maformed request", 244);

    const rvId = await fromSnowflake(channel_id);

    const rvChannel = await res.rvAPI.get(`/channels/${rvId as ""}`);
    await res.rvAPI.delete(`/channels/${rvId as ""}`);

    res.json(await Channel.from_quark(rvChannel));
  },
};
