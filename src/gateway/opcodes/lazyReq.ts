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
import { APIGuildMember, GatewayDispatchEvents, GatewayOpcodes } from "discord.js";
import { API } from "revolt.js";
import {
  internalStatus, Member, Status, fromSnowflake, toSnowflake, createUserPresence,
} from "@reflectcord/common/models";
import {
  LazyRequest, GatewayDispatchCodes, LazyRange, SyncItem, LazyGroup, LazyOpMember,
} from "@reflectcord/common/sparkle";
import { MemberContainer } from "@reflectcord/common/managers";
import { listenEvent } from "@reflectcord/common/Events";
import Long from "long";
import { Send, Payload, Dispatch } from "../util";
import { WebSocket } from "../Socket";
import { check } from "./instanceOf";
import "missing-native-js-functions";

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
  range: LazyRange,
  target_channel: string,
  activities?: boolean,
) {
  if (!Array.isArray(range) || range.length !== 2) throw new Error("invalid range");

  const groups: LazyGroup[] = [];
  const items: { group?: LazyGroup, member?: LazyOpMember }[] = [];
  const discordGuildId = await toSnowflake(guild_id);
  const offlineItems: { group?: LazyGroup, member?: LazyOpMember }[] = [];

  let members = await this.rvAPI.get(`/servers/${guild_id as ""}/members`, {
    exclude_offline: false,
  });
  if (members.members.length > 1000) {
    members = await this.rvAPI.get(`/servers/${guild_id as ""}/members`, {
      exclude_offline: true,
    });
  }

  const server = this.rvAPIWrapper.servers.get(guild_id);
  const channel = this.rvAPIWrapper.channels.get(target_channel);

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
    return (highestRank > otherHighest ? 0 : highestRank < otherHighest ? -1 : 1);
  });

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

  const extendedMembers = [...discordMembers];

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
    const group: SyncItem = {
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

      const status = member.status?.status ?? "offline";

      const item = {
        member: {
          ...member.discord,
          roles: userRoles,
          presence: {
            activities: activities ? member.status?.activities as any : [],
            client_status: {
              web: status,
            },
            status: status as any,
            user: { id: member.discord.user!.id },
          },
        },
      };

      if (member.status?.status === "invisible" || member.status?.status as string === "offline") {
        item.member.presence.status = "offline";
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
    results: {
      items,
      groups,
      range,
      members: items.map((x) => ("member" in x ? x.member : undefined)).filter((x) => !!x),
    },
    extendedMembers,
  };
}

function subscribeToMember(this: WebSocket, id: string) {
  if (this.events[id]) return false; // already subscribed as friend
  if (this.member_events[id]) return false; // already subscribed in member list
  this.subscribed_members.push(id);

  return true;
}

// FIXME: Partially implemented
export async function lazyReq(this: WebSocket, data: Payload<LazyRequest>) {
  check.call(this, LazyRequest, data.d);

  const {
    guild_id, typing, channels, activities, threads, members,
  } = data.d!;

  const channel_id = Object.keys(channels || {}).first();
  if (!channel_id) return;

  const rvChannelId = await fromSnowflake(channel_id);
  const rvServerId = await fromSnowflake(guild_id);
  const server = this.rvAPIWrapper.servers.get(rvServerId);
  if (!server) throw new Error(`Server ${server} is not in RVAPI cache`);

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

  // https://github.com/fosscord/fosscord-server/blob/76c85f7181cf5116b8f4ccd9015d1df371eb9c01/src/gateway/opcodes/LazyRequest.ts#L218
  if (members) {
    await Promise.all(members.map(async (id) => {
      const rvMemberId = await fromSnowflake(id);
      const user = await this.rvAPIWrapper.users.fetch(rvMemberId);
      const alreadySubscribed = subscribeToMember.call(
        this,
        rvMemberId,
      );
      if (!alreadySubscribed) return;

      const presence = createUserPresence({
        user: user.revolt,
        discordUser: user.discord,
        server: server.revolt._id,
      });

      await Dispatch(this, GatewayDispatchEvents.PresenceUpdate, presence);
    }));

    if (!channels) return;
  }

  const results = await getMembers
    .call(this, rvServerId, [0, 99], rvChannelId, this.subscribed_servers[rvServerId]?.activities);
  const ops = results.results;
  const member_count = ops.members.length;

  results.extendedMembers.forEach((member) => subscribeToMember.call(this, member.revolt._id.user));

  const { groups } = ops;

  if (subscribedServer.threads) {
    // STUB
    await Dispatch(this, GatewayDispatchCodes.ThreadListSync, {
      guild_id,
      most_recent_messages: [],
      threads: [],
    });
  }

  await Dispatch(this, GatewayDispatchCodes.GuildMemberListUpdate, {
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
  });
}
