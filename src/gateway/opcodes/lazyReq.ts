/* eslint-disable no-restricted-syntax */
/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import { APIGuildMember, GatewayOpcodes } from "discord.js";
import { API } from "revolt.js";
import {
  internalStatus, Member, Status, fromSnowflake, toSnowflake,
} from "@reflectcord/common/models";
import { LazyRequest } from "@reflectcord/common/sparkle";
import { MemberContainer } from "@reflectcord/common/managers";
import { Send, Payload } from "../util";
import { WebSocket } from "../Socket";
import { check } from "./instanceOf";
import "missing-native-js-functions";

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
  this: WebSocket,
  guild_id: string,
  range: LazyOperatorRange,
) {
  if (!Array.isArray(range) || range.length !== 2) throw new Error("invalid range");

  const groups: LazyGroup[] = [];
  const items: SyncItem[] = [];
  const discordGuildId = await toSnowflake(guild_id);
  const offlineItems: SyncItem[] = [];

  const members = await this.rvAPI.get(`/servers/${guild_id as ""}/members`, {
    exclude_offline: true,
  });

  const server = this.rvAPIWrapper.servers.get(guild_id);

  members.members.sort((x, y) => {
    const extractRoles = (r: string) => server?.revolt.roles?.[r];

    const userRoles = x.roles?.map(extractRoles);
    const otherUserRoles = y.roles?.map(extractRoles);

    const roleRanks = userRoles
      ?.filter((r) => r?.hoist)
      ?.map((r) => r?.rank!).filter((r) => r !== undefined) ?? [999];
    const otherRoleRanks = otherUserRoles
      ?.filter((r) => r?.hoist)
      ?.map((r) => r?.rank!).filter((r) => r !== undefined) ?? [999];

    const highestRank = Math.min(...roleRanks);
    const otherHighest = Math.min(...otherRoleRanks);

    // eslint-disable-next-line no-nested-ternary
    return (highestRank < otherHighest ? 0 : highestRank > otherHighest ? -1 : 1);
  });

  type extendMemberContainer = MemberContainer & {
    user?: API.User | undefined | null,
    status?: internalStatus | null,
  }

  let discordMembers: extendMemberContainer[] = await Promise.all(members.members
    .map(async (member) => {
      const user = members.users.find((x) => x._id === member._id.user);

      const discordMember = await Member.from_quark(member, user);

      if (discordMember.roles.length < 1 && user?.online) discordMember.roles.push(discordGuildId);

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
    discordGuildId,
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

      if (member.status?.status === "invisible") {
        offlineItems.push(item);
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

  const ops = await getMembers.call(this, rvServerId, [0, 99]);
  const member_count = ops.members.length;

  const { groups } = ops;

  return Send(this, {
    op: GatewayOpcodes.Dispatch,
    s: this.sequence++,
    t: "GUILD_MEMBER_LIST_UPDATE",
    d: {
      ops: [{
        items: ops.items,
        op: "SYNC",
        range: ops.range,
      }],
      online_count: member_count - (groups.find((x) => x.id === "offline")?.count ?? 0),
      member_count,
      id: "everyone",
      guild_id,
      groups,
    },
  });
}
