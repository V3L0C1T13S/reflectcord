/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import { GatewayOpcodes } from "discord.js";
import { fromSnowflake, Member, internalActivity } from "@reflectcord/common/models";
import { GuildSyncSchema } from "@reflectcord/common/sparkle";
import { Dispatch, Send } from "../util";
import { WebSocket } from "../Socket";
import { Payload } from "../util/Constants";

async function GuildSync(this: WebSocket, guild_id: string) {
  const rvServerId = await fromSnowflake(guild_id);

  const server = this.rvAPIWrapper.servers.get(rvServerId);
  if (!server) return;

  const members = await server.extra!.members.fetchAll(rvServerId, false);

  const discordMembers = members.map((x) => x.discord);

  // FIXME
  const presences: internalActivity[] = [];

  await Dispatch(this, "GUILD_SYNC", {
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
