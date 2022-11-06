/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import {
  GatewayOpcodes, GatewayDispatchEvents,
  GatewayRequestGuildMembersDataWithUserIds, GatewayRequestGuildMembersData, APIGuildMember,
} from "discord.js";
import { Payload, Send } from "../util";
import { fromSnowflake } from "../../common/models/util";
import { WebSocket } from "../Socket";
import { Member } from "../../common/models";
import { gatewayEnableOp8 } from "../../common/constants";
import { Logger } from "../../common/utils";

const filterMember = (x: APIGuildMember, user_ids: string[]) => x.user?.id === user_ids
  .find((u) => x.user?.id === u);

const memberExists = (uid: string, member_ids: string[]) => member_ids.find((x) => x === uid);

export async function RequestGuildMembers(
  this: WebSocket,
  data: Payload<GatewayRequestGuildMembersDataWithUserIds>,
) {
  if (!gatewayEnableOp8) return;

  if (!data.d) return;

  const {
    guild_id, presences, nonce, user_ids,
  } = data.d;

  const realGuildId = Array.isArray(guild_id) ? (guild_id?.[0]) : guild_id;

  const rvId = await fromSnowflake(realGuildId);

  const limit = 1000;

  // FIXME: We probably shouldn't get every single member, or at least cache this for later.
  const members = (await this.rvAPI.get(`/servers/${rvId as ""}/members`, {
    exclude_offline: true,
  }));

  members.members.splice(limit);
  members.users.splice(limit);

  const discordMembers = (await Promise.all(members.members
    .map((x) => Member.from_quark(x, members.users.find((u) => u._id === x._id.user)))));

  const notFound: string[] = [];

  if (Array.isArray(user_ids)) {
    notFound.push(...(user_ids
      .filter((x) => memberExists(x, discordMembers.map((m) => m.user?.id ?? "0")))));
  }

  await Send(this, {
    op: GatewayOpcodes.Dispatch,
    t: GatewayDispatchEvents.GuildMembersChunk,
    s: this.sequence++,
    d: {
      guild_id,
      members: discordMembers,
      not_found: notFound,
    },
  });
}
