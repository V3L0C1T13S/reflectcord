/* eslint-disable no-restricted-syntax */
/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import { APIGuildMember, GatewayOpcodes } from "discord.js";
import { API } from "revolt.js";
import { Member } from "../../common/models";
import { Send, Payload } from "../util";
import { WebSocket } from "../Socket";
import { fromSnowflake, toSnowflake } from "../../common/models/util";
import { check } from "./instanceOf";
import { LazyRequest } from "../../common/sparkle/schemas";
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

async function getMembers(this: WebSocket, guild_id: string, range: LazyOperatorRange) {
  if (!Array.isArray(range) || range.length !== 2) throw new Error("invalid range");

  const groups: LazyGroup[] = [];
  const items: SyncItem[] = [];
  const discordGuildId = await toSnowflake(guild_id);

  const members = await this.rvAPI.get(`/servers/${guild_id}/members`, {
    exclude_offline: true,
  }) as API.AllMemberResponse;

  let discordMembers = await Promise.all(members.members.map((x) => Member.from_quark(x)));

  const memberRoles = discordMembers
    .map((x) => x.roles)
    .flat()
    .unique((r) => r);

  memberRoles.push(
    discordGuildId,
  );

  const offlineItems: SyncItem[] = [];

  memberRoles.forEach((role) => {
    // @ts-ignore
    const [role_members, other_members]: [APIGuildMember[], APIGuildMember[]] = partition(
      discordMembers,
      (m: APIGuildMember) => m.roles
        .find((r) => r === role),
    );
    const group = {
      count: role_members.length,
      id: role === discordGuildId ? "online" : role,
    };

    items.push({ group });
    groups.push(group);

    role_members.forEach((member) => {
      const userRoles = member.roles.filter((x) => x !== discordGuildId).map((x) => x);

      const statusPriority = {
        online: 0,
        idle: 1,
        dnd: 2,
        invisible: 3,
        offline: 4,
      };

      const session = {
        status: "online",
      };

      const item = {
        member: {
          ...member,
          roles: userRoles,
          user: member.user,
          presence: {
            ...session,
            activities: [],
            user: { id: member.user?.id },
          },
        },
      } as SyncItem;

      items.push(item);
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
export async function lazyReq(this: WebSocket, data: Payload) {
  check.call(this, LazyRequest, data.d);
  const {
    guild_id, typing, channels, activities,
  } = data.d;

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
