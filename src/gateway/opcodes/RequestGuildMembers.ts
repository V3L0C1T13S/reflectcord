/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import { GatewayOpcodes, GatewayDispatchEvents } from "discord.js";
import { Payload, Send } from "../util";
import { fromSnowflake } from "../../common/models/util";
import { WebSocket } from "../Socket";
import { Member } from "../../common/models";
import { gatewayEnableOp8 } from "../../common/constants";

export async function RequestGuildMembers(
  this: WebSocket,
  data: Payload,
) {
  if (!gatewayEnableOp8) return;

  if (!data.d) return;

  const { guild_id, presences, nonce } = data.d;

  // FIXME: Bots send a string but clients an array???
  const realGuildId = guild_id?.[0];

  const rvId = await fromSnowflake(realGuildId);

  const limit = 100;

  // FIXME: We probably shouldn't get every single member, or at least cache this for later.
  const members = await this.rvAPI.get(`/servers/${rvId as ""}/members`, {
    exclude_offline: true,
  });

  const discordMembers = await Promise.all(members.members
    .map((x) => Member.from_quark(x, members.users.find((u) => u._id === x._id.user))));

  await Send(this, {
    op: GatewayOpcodes.Dispatch,
    t: GatewayDispatchEvents.GuildMembersChunk,
    s: this.sequence++,
    d: {
      guild_id,
      members: discordMembers,
      not_found: [],
    },
  });
}
