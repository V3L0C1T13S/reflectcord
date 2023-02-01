/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { fromSnowflake, InviteCreate } from "@reflectcord/common/models";
import { emitEvent } from "@reflectcord/common/Events";
import { GatewayDispatchEvents } from "discord.js";

export default () => <Resource> {
  post: async (req, res) => {
    const { channel_id } = req.params;

    if (!channel_id) throw new HTTPError("Invalid params");

    const rvChannel = await fromSnowflake(channel_id);

    const rvInvite = await res.rvAPI.post(`/channels/${rvChannel as ""}/invites`);
    if (rvInvite.type !== "Server") throw new HTTPError("Revolt returned invalid invite type");

    const channel = await res.rvAPIWrapper.channels.fetch(rvChannel);
    const invite = await InviteCreate.from_quark(rvInvite, {
      channel: channel.revolt,
    });

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
    const rvChannel = await res.rvAPIWrapper.channels.fetch(rvChannelId);

    if (!("server" in rvChannel.revolt && rvChannel.revolt.server)) return res.json([]);

    const invites = (await res.rvAPIWrapper.servers.getInvites(rvChannel.revolt.server))
      .filter((x) => x.channel === rvChannelId);

    return res.json(await Promise.all(invites.map(async (x) => InviteCreate.from_quark(x, {
      channel: rvChannel.revolt,
      discordInviter: (await res.rvAPIWrapper.users.fetch(x.creator)).discord,
    }))));
  },
};
