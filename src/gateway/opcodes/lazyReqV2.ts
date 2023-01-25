/*
  Fosscord: A FOSS re-implementation and extension of the Discord.com backend.
  Copyright (C) 2023 Fosscord and Fosscord Contributors

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published
  by the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/* eslint-disable no-restricted-syntax */
/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import { APIGuildMember, GatewayOpcodes, GatewayDispatchEvents } from "discord.js";
import { API } from "revolt.js";
import {
  internalStatus, Member, Status, fromSnowflake, toSnowflake,
} from "@reflectcord/common/models";
import { GatewayDispatchCodes, LazyRequest } from "@reflectcord/common/sparkle";
import { MemberContainer } from "@reflectcord/common/managers";
import { AllMemberResponse } from "revolt-api";
import { Send, Payload, Dispatch } from "../util";
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
  member: APIGuildMember & {
    presence: any,
  },
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

async function getMembersV2(
  this: WebSocket,
  guild_id: string,
  range: LazyOperatorRange,
  rvMembers: AllMemberResponse,
  activities: boolean,
  onlineMembers: number,
) {
  const groups: LazyGroup[] = [];
  const items: SyncItem[] = [];
  const discordGuildId = await toSnowflake(guild_id);
  const offlineItems: SyncItem[] = [];

  const members = {
    members: rvMembers.members.slice(range[0], range[1]),
    users: rvMembers.users,
  };

  // members.members.slice(range[0], range[1]);
  // members.users.splice(range[0], range[1]);

  type extendMemberContainer = MemberContainer & {
    user?: API.User | undefined | null,
    status?: internalStatus | null,
  }

  let discordMembers: extendMemberContainer[] = await Promise.all(members.members
    .map(async (member, i) => {
      const user = members.users.find((x) => x._id === member._id.user);

      const discordMember = await Member.from_quark(member, { user });

      if (discordMember.roles.length < 1) discordMember.roles.push(discordGuildId);

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
      count: role === discordGuildId ? onlineMembers : role_members.length,
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

      const status = member.status?.status ?? "offline";

      const item = {
        member: {
          ...member.discord,
          roles: userRoles,
          user: member.discord.user,
          presence: {
            activities: activities ? member.status?.activities : [],
            client_status: {
              web: status,
            },
            status,
            user: { id: member.discord.user?.id },
          },
        },
      } as SyncItem;

      if (member.status?.status === "invisible" || member.status?.status as string === "offline") {
        if ("member" in item) item.member.presence.status = "offline";
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

// FIXME: Partially implemented
export async function lazyReqV2(this: WebSocket, data: Payload<LazyRequest>) {
  check.call(this, LazyRequest, data.d);

  const {
    guild_id, typing, channels, activities, threads,
  } = data.d!;

  const channel_id = Object.keys(channels || {}).first();
  if (!channel_id) return;

  const rvChannelId = await fromSnowflake(channel_id);
  const rvServerId = await fromSnowflake(guild_id);

  const ranges = channels![channel_id];
  if (!Array.isArray(ranges)) throw new Error("Not a valid Array");

  // eslint-disable-next-line no-multi-assign
  const subscribedServer = this.subscribed_servers[rvServerId] ??= {};
  // eslint-disable-next-line no-multi-assign
  const lazyChannel = this.lazy_channels[rvChannelId] ??= {};

  if (activities !== undefined) subscribedServer.activities = activities;
  if (typing !== undefined) subscribedServer.typing = typing;
  if (threads !== undefined) subscribedServer.threads = threads;
  lazyChannel.messages = true;

  const members = await this.rvAPI.get(`/servers/${rvServerId as ""}/members`, {
    exclude_offline: true,
  });

  const server = this.rvAPIWrapper.servers.get(rvServerId);
  const onlineCount = members.users.filter((x) => x.online).length;

  members.members.sort((x, y) => {
    const userA = members.users.find((user) => x._id.user === user._id);
    if (!userA?.online) return 1;

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

    return highestRank - otherHighest;
  });

  const ops = await Promise.all(ranges
    .map((x) => getMembersV2.call(this, rvServerId, x, members, !!activities, onlineCount)));

  ops.forEach((op) => {
    op.members.forEach((member) => {
      if (!member?.user) return;

      if (this.events[member.user.id]) return;
      if (this.member_events[member.user.id]) return;
    });
  });
  const member_count = members.members.length;

  const groups = ops
    .map((x) => x.groups)
    .flat()
    .unique();

  if (subscribedServer.threads) {
    // STUB
    await Dispatch(this, GatewayDispatchCodes.ThreadListSync, {
      guild_id,
      most_recent_messages: [],
      threads: [],
    });
  }

  await Dispatch(this, GatewayDispatchCodes.GuildMemberListUpdate, {
    ops: ops.map((x) => ({
      items: x.items,
      op: "SYNC",
      range: x.range,
    })),
    online_count: onlineCount,
    member_count,
    id: "everyone",
    guild_id,
    groups,
  });
}
