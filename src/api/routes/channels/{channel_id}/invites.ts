/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { fromSnowflake, InviteCreate } from "@reflectcord/common/models";
import { emitEvent } from "@reflectcord/common/Events";
import { GatewayDispatchEvents } from "discord.js";

export default (express: Application) => <Resource> {
  post: async (req, res) => {
    const { channel_id } = req.params;

    if (!channel_id) throw new HTTPError("Invalid params");

    const rvChannel = await fromSnowflake(channel_id);

    const rvInvite = await res.rvAPI.post(`/channels/${rvChannel as ""}/invites`);
    if (rvInvite.type !== "Server") throw new HTTPError("Revolt returned invalid invite type");

    const invite = await InviteCreate.from_quark(rvInvite);

    await emitEvent({
      event: GatewayDispatchEvents.InviteCreate,
      data: {
        ...invite,
        inviter: invite.inviter,
        guild_id: invite.guild?.id,
        channel: channel_id,
      },
      guild_id: rvInvite.server,
    });

    res.status(201).json(invite);
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
