/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import { GatewayOpcodes } from "discord.js";
import { Send } from "../util";
import { fromSnowflake } from "../../common/models/util";
import { WebSocket } from "../Socket";
import { Payload } from "../util/Constants";
import { Member } from "../../common/models/models/member";
import { internalActivity } from "../../common/models";

export async function GuildSync(this: WebSocket, data: Payload) {
  if (!data.d) return;

  const { guild_id } = data.d;

  const rvServerId = await fromSnowflake(guild_id);

  const members = await this.rvAPI.get(`/servers/${rvServerId as ""}/members`);

  const discordMembers = await Promise.all(members.members
    .map((x) => Member.from_quark(x, members.users.find((u) => u._id === x._id.user))));

  // FIXME
  const presences: internalActivity[] = [];

  await Send(this, {
    op: GatewayOpcodes.Dispatch,
    t: "GUILD_SYNC",
    s: this.sequence++,
    d: {
      id: guild_id,
      members: discordMembers,
      presences,
    },
  });
}
