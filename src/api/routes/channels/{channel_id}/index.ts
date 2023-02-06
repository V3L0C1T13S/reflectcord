/* eslint-disable camelcase */
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import {
  fromSnowflake, Channel, ChannelPatchBody, Permissions,
} from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";
import { APIChannel } from "discord.js";

export async function getChannel(api: API.API, id: string) {
  const rvChannel = await api.get(`/channels/${id as ""}`);

  return rvChannel;
}

export default () => <Resource> {
  get: async (req, res: Response<APIChannel>) => {
    const { channel_id } = req.params;
    if (!channel_id) throw new HTTPError("Bad params");

    const rvId = await fromSnowflake(channel_id);

    const rvChannel = await getChannel(res.rvAPI, rvId);

    res.json(await Channel.from_quark(rvChannel));
  },
  patch: async (req, res: Response<APIChannel>) => {
    const { channel_id } = req.params;
    if (!channel_id) throw new HTTPError("Bad params");

    const rvId = await fromSnowflake(channel_id);
    const rvChannel = await res.rvAPIWrapper.channels
      .editChannel(rvId, await ChannelPatchBody.to_quark(req.body));

    if (req.body.allow && req.body.deny && req.body.id) {
      if (!("server" in rvChannel)) throw new HTTPError("Not a server channel.");

      let roleId = await fromSnowflake(req.body.id);
      if (roleId === rvChannel.server) roleId = "default";

      const allow = BigInt(req.body.allow);
      const deny = BigInt(req.body.deny);

      const rvAllow = await Permissions.to_quark(allow);
      const rvDeny = await Permissions.to_quark(deny);

      await res.rvAPI.put(`/channels/${rvId as ""}/permissions/${roleId as ""}`, {
        permissions: {
          allow: rvAllow.a,
          deny: rvDeny.a,
        },
      });
    }

    res.json(await Channel.from_quark(rvChannel));
  },
  delete: async (req, res: Response<APIChannel>) => {
    const { channel_id } = req.params;
    if (!channel_id) throw new HTTPError("Bad params");

    const rvId = await fromSnowflake(channel_id);

    const rvChannel = await res.rvAPI.get(`/channels/${rvId as ""}`);
    await res.rvAPI.delete(`/channels/${rvId as ""}`);

    res.json(await Channel.from_quark(rvChannel));
  },
};
