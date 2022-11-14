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
import { Member, Status, User } from "../../common/models";
import { check } from "./instanceOf";
import { ReqGuildMembersSchema } from "../../common/sparkle";

const memberExists = (uid: string, member_ids: string[]) => member_ids.includes(uid);

const isUidSearch = (data: GatewayRequestGuildMembersData): data is GatewayRequestGuildMembersDataWithUserIds => (("user_ids" in data));

type RequestGuildMembersBody = {
  guild_id: string | string[],
  members: APIGuildMember[],
  not_found?: string[],
  presences?: any[],
}

export async function RequestGuildMembers(
  this: WebSocket,
  data: Payload<GatewayRequestGuildMembersData>,
) {
  // FIXME: Doesn't work 100% of the time
  check.call(this, ReqGuildMembersSchema, data.d);

  const reqData = data.d!;
  const {
    guild_id, presences, nonce,
  } = reqData;

  const body: RequestGuildMembersBody = {
    guild_id,
    members: [],
  };

  const realGuildId = Array.isArray(guild_id) ? (guild_id?.[0] as string) : guild_id;

  const rvId = await fromSnowflake(realGuildId);

  const limit = 1000;

  // FIXME: We probably shouldn't get every single member, or at least cache this for later.
  const members = await this.rvAPI.get(`/servers/${rvId as ""}/members`, {
    exclude_offline: false,
  });

  members.members.splice(limit);
  members.users.splice(limit);

  const discordMembers = (await Promise.all(members.members
    .map((x) => Member.from_quark(x, members.users.find((u) => u._id === x._id.user)))));

  body.members = discordMembers;

  if (isUidSearch(reqData)) {
    const { user_ids } = reqData;

    const notFound: string[] = [];

    const foundUsers = discordMembers.map((m) => m.user?.id ?? "0");

    if (Array.isArray(user_ids)) {
      notFound.push(...(user_ids
        .filter((x) => !memberExists(x, discordMembers.map((m) => m.user?.id ?? "0")))));
      body.members = discordMembers.filter((x) => (x.user ? user_ids.includes(x.user.id) : false));
    } else {
      if (!memberExists(user_ids, foundUsers)) notFound.push(user_ids);
      body.members = discordMembers.filter((x) => (x.user ? x.user.id === user_ids : false));
    }

    body.not_found = notFound;
  }

  if (presences) {
    const discordPresences = await Promise.all(members.users.map(async (x) => {
      const status = await Status.from_quark(x.status);
      const discordPresence = {
        user: await User.from_quark(x),
        guild_id,
        status: status.status,
        activites: status.activities,
        client_status: {
          desktop: status.status,
        },
      };

      return discordPresence;
    }));

    body.presences = discordPresences;
  }

  await Send(this, {
    op: GatewayOpcodes.Dispatch,
    t: GatewayDispatchEvents.GuildMembersChunk,
    s: this.sequence++,
    d: body,
  });
}
