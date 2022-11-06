/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import {
  GatewayOpcodes, GatewayDispatchEvents,
  GatewayRequestGuildMembersDataWithUserIds,
  GatewayRequestGuildMembersData,
  APIGuildMember,
} from "discord.js";
import { Payload, Send } from "../util";
import { fromSnowflake } from "../../common/models/util";
import { WebSocket } from "../Socket";
import { Member } from "../../common/models";
import { gatewayEnableOp8 } from "../../common/constants";

const memberExists = (uid: string, member_ids: string[]) => member_ids.includes(uid);

const isUidSearch = (data: GatewayRequestGuildMembersData): data is GatewayRequestGuildMembersDataWithUserIds => ("user_ids" in data);

type RequestGuildMembersBody = {
  guild_id: string,
  members: APIGuildMember[],
  not_found?: string[],
  presences?: any[],
}

export async function RequestGuildMembers(
  this: WebSocket,
  data: Payload<GatewayRequestGuildMembersData>,
) {
  if (!gatewayEnableOp8) return;

  if (!data.d) return;

  const {
    guild_id, presences, nonce,
  } = data.d;

  const body: RequestGuildMembersBody = {
    guild_id,
    members: [],
  };

  const realGuildId = Array.isArray(guild_id) ? (guild_id?.[0] as string) : guild_id;

  const rvId = await fromSnowflake(realGuildId);

  const limit = 1000;

  // FIXME: We probably shouldn't get every single member, or at least cache this for later.
  const members = await this.rvAPI.get(`/servers/${rvId as ""}/members`, {
    exclude_offline: true,
  });

  members.members.splice(limit);
  members.users.splice(limit);

  const discordMembers = (await Promise.all(members.members
    .map((x) => Member.from_quark(x, members.users.find((u) => u._id === x._id.user)))));

  body.members = discordMembers;

  if (isUidSearch(data.d)) {
    const { user_ids } = data.d;

    const notFound: string[] = [];

    if (Array.isArray(user_ids)) {
      notFound.push(...(user_ids
        .filter((x) => !memberExists(x, discordMembers.map((m) => m.user?.id ?? "0")))));
    }

    body.members = discordMembers.filter((x) => (x.user ? user_ids.includes(x.user.id) : false));

    body.not_found = notFound;
  }

  await Send(this, {
    op: GatewayOpcodes.Dispatch,
    t: GatewayDispatchEvents.GuildMembersChunk,
    s: this.sequence++,
    d: body,
  });
}
