/* eslint-disable no-restricted-syntax */
/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import { APIGuildMember, GatewayOpcodes } from "discord.js";
import { API } from "revolt.js";
import { internalStatus, Member, Status } from "../../common/models";
import { Send, Payload } from "../util";
import { WebSocket } from "../Socket";
import { fromSnowflake, toSnowflake } from "../../common/models/util";
import { check } from "./instanceOf";
import { LazyRequest } from "../../common/sparkle/schemas";
import "missing-native-js-functions";
import { MemberContainer } from "../../common/managers";

type LazyGroup = {
  /** Group ID */
  id: string,
  /** Amount of members in this group */
  count: number,
};

type OperatorType = "SYNC" | "INVALIDATE" | "DELETE" | "UPDATE";

type LazyOperatorRange = [number, number];

type SyncItem = {
  group: LazyGroup,
} | {
  member: APIGuildMember,
};

type LazyOperator = {
  op: OperatorType,
  range?: LazyOperatorRange,
  items: SyncItem[],
  index: number,
  item: SyncItem,
};

type SyncLazyOperator = Omit<LazyOperator, "range, index"> & {
  op: "SYNC",
};

type LazyRequestEvent = {
  /** The list being updated */
  id: string,
  guild_id: string,
  ops: LazyOperator[],
  groups: LazyGroup[];
};

function partition<T>(array: T[], isValid: Function) {
  // @ts-ignore
  return array.reduce(
    // @ts-ignore
    ([pass, fail], elem) => (isValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]]),
    [[], []],
  );
}

async function getMembers(
  guild_id: string,
  rvMembers: API.AllMemberResponse,
  range: LazyOperatorRange,
) {
  if (!Array.isArray(range) || range.length !== 2) throw new Error("invalid range");

  const groups: LazyGroup[] = [];
  const items: SyncItem[] = [];
  const discordGuildId = await toSnowflake(guild_id);
  const offlineItems: SyncItem[] = [];

  const members = {
    members: rvMembers.members.slice(range[0], range[1]),
    users: rvMembers.users,
  };

  type extendMemberContainer = MemberContainer & {
    user?: API.User | undefined | null,
    status?: internalStatus | null,
  }

  let discordMembers: extendMemberContainer[] = await Promise.all(members.members
    .map(async (member) => {
      const user = members.users.find((x) => x._id === member._id.user);

      const discordMember = await Member.from_quark(member, user);

      discordMember.roles.push(discordGuildId);

      return {
        revolt: member,
        discord: discordMember,
        user,
        status: await Status.from_quark(user?.status, {
          online: user?.online,
        }),
      };
    }));

  const memberRoles = discordMembers
    .map((x) => x.discord.roles)
    .flat()
    .unique((r) => r);

  memberRoles.push(
    memberRoles.splice(
      memberRoles.findIndex(((x) => x === discordGuildId)),
      1,
    )[0]!,
  );

  memberRoles.forEach((role) => {
    // @ts-expect-error
    // eslint-disable-next-line max-len
    const [role_members, other_members]: [extendMemberContainer[], extendMemberContainer[]] = partition(
      discordMembers,
      (m: extendMemberContainer) => m.discord.roles
        .find((r) => r === role),
    );
    const group = {
      count: role_members.length,
      id: role === discordGuildId ? "online" : role,
    };

    items.push({ group });
    groups.push(group);

    role_members.forEach((member) => {
      const userRoles = member.discord.roles.filter((x) => x !== discordGuildId);

      const statusPriority = {
        online: 0,
        idle: 1,
        dnd: 2,
        invisible: 3,
        offline: 4,
      };

      const session = {
        status: member.status?.status,
      };

      const item = {
        member: {
          ...member.discord,
          roles: userRoles,
          user: member.discord.user,
          presence: {
            ...session,
            activities: member.status?.activities ?? [],
            user: { id: member.discord.user?.id },
          },
        },
      } as SyncItem;

      if (!member.user?.online) {
        offlineItems.push(item);
        group.count--;
      } else items.push(item);
    });
    discordMembers = other_members;
  });

  if (offlineItems.length > 0) {
    const group = {
      count: offlineItems.length,
      id: "offline",
    };
    items.push({ group });
    groups.push(group);

    items.push(...offlineItems);
  }

  return {
    items,
    groups,
    range,
    members: items.map((x) => ("member" in x ? x.member : undefined)).filter((x) => !!x),
  };
}

/**
 * Handles getting members concurrently, splitting the load between each range.
*/
async function HandleGetMembers(this: WebSocket, guild_id: string, ranges: LazyOperatorRange[]) {
  const members = await this.rvAPI.get(`/servers/${guild_id as ""}/members`, {
    exclude_offline: true,
  });

  const server = await this.rvAPIWrapper.servers.fetch(guild_id);

  members.members.sort((x, y) => {
    const user = members.users.find((u) => x._id.user === u._id);
    const otherUser = members.users.find((u) => y._id.user === u._id);

    const isOnline = user?.online ?? false;
    const otherOnline = otherUser?.online ?? false;

    const roles = x.roles
      ?.map((r) => server.revolt.roles?.[r]).filter((r) => r) as API.Role[] ?? [999];
    const highestRank = roles.length > 0 ? Math.min(...roles.map((r) => r.rank ?? 999)) : 999;

    return highestRank;
  });

  const member_count = members.members.length;

  const ops = await Promise.all(ranges.map((x) => getMembers(guild_id, members, x)));

  return {
    ops,
    member_count,
  };
}

// FIXME: Partially implemented
export async function lazyReq(this: WebSocket, data: Payload<LazyRequest>) {
  check.call(this, LazyRequest, data.d);

  const {
    guild_id, typing, channels, activities,
  } = data.d!;

  const channel_id = Object.keys(channels || {}).first();
  if (!channel_id) return;

  const rvChannelId = await fromSnowflake(channel_id);
  const rvServerId = await fromSnowflake(guild_id);

  const ranges = channels![channel_id];
  if (!Array.isArray(ranges)) throw new Error("Not a valid Array");

  const memberResults = await HandleGetMembers.call(this, rvServerId, ranges);
  const { member_count, ops } = memberResults;

  const groups = ops
    .map((x) => x.groups)
    .flat()
    .unique();

  return Send(this, {
    op: GatewayOpcodes.Dispatch,
    s: this.sequence++,
    t: "GUILD_MEMBER_LIST_UPDATE",
    d: {
      ops: ops.map((x) => ({
        items: x.items,
        op: "SYNC",
        range: x.range,
      })),
      online_count: member_count - (groups.find((x) => x.id === "offline")?.count ?? 0),
      member_count,
      id: "everyone",
      guild_id,
      groups,
    },
  });
}
