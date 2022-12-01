/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { fromSnowflake, InviteCreate } from "@reflectcord/common/models";

export default (express: Application) => <Resource> {
  post: async (req, res) => {
    const { channel_id } = req.params;

    if (!channel_id) throw new HTTPError("Invalid params");

    const rvChannel = await fromSnowflake(channel_id);

    const rvInvite = await res.rvAPI.post(`/channels/${rvChannel as ""}/invites`);
    if (rvInvite.type !== "Server") throw new HTTPError("Revolt returned invalid invite type");

    res.json(await InviteCreate.from_quark(rvInvite));
  },
  get: async (req, res) => {
    const { channel_id } = req.params;

    if (!channel_id) throw new HTTPError("Invalid params");

    const rvChannelId = await fromSnowflake(channel_id);
    const rvChannel = await res.rvAPI.get(`/channels/${rvChannelId as ""}`);

    if (!("server" in rvChannel && rvChannel.server)) return res.json([]);

    const invites = (await res.rvAPI.get(`/servers/${rvChannel.server as ""}/invites`))
      .filter((x) => x.channel === rvChannelId);

    return res.json(await Promise.all(invites.map((x) => InviteCreate.from_quark(x))));
  },
};
