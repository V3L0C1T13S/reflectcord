/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import { fromSnowflake, internalActivity, Status } from "@reflectcord/common/models";
import { GatewayDispatchCodes, GuildSyncSchema } from "@reflectcord/common/sparkle";
import { Dispatch } from "../util";
import { WebSocket } from "../Socket";
import { Payload } from "../util/Constants";

async function GuildSync(this: WebSocket, guild_id: string) {
  const rvServerId = await fromSnowflake(guild_id);

  const server = this.rvAPIWrapper.servers.get(rvServerId);
  if (!server) return;

  const members = await server.extra!.members.fetchAll(rvServerId, false);

  const discordMembers = members.map((x) => x.discord);

  // FIXME
  const presences = await Promise.all(members.map(async (member) => {
    const rvUser = this.rvAPIWrapper.users.get(member.revolt._id.user);
    const status = await Status.from_quark(rvUser?.revolt.status);
    const { activities } = status;
    return {
      user: member.discord.user,
      guild_id,
      status: status.status,
      activities: activities ?? [],
      client_status: {
        desktop: status.status,
      },
      shardId: 0,
    };
  }));

  await Dispatch(this, GatewayDispatchCodes.GuildSync, {
    id: guild_id,
    members: discordMembers,
    presences,
  });
}

export async function HandleGuildSync(this: WebSocket, data: Payload<GuildSyncSchema>) {
  if (!data.d) return;

  const reqData = data.d;

  await Promise.all((reqData.map((x) => GuildSync.call(this, x))));
}
