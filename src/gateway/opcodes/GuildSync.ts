/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import { GatewayOpcodes } from "discord.js";
import { Send } from "../util";
import { fromSnowflake } from "../../common/models/util";
import { WebSocket } from "../Socket";
import { Payload } from "../util/Constants";
import { Member, internalActivity } from "../../common/models";
import { GuildSyncSchema } from "../../common/sparkle";

async function GuildSync(this: WebSocket, guild_id: string) {
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

export async function HandleGuildSync(this: WebSocket, data: Payload<GuildSyncSchema>) {
  if (!data.d) return;

  const reqData = data.d;

  // eslint-disable-next-line no-restricted-syntax
  for (const guild_id of reqData) {
    // eslint-disable-next-line no-await-in-loop
    await GuildSync.call(this, guild_id);
  }
}
