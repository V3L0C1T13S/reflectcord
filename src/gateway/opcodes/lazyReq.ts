/* eslint-disable no-bitwise */
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
import {
  APIOverwrite,
  APIRole,
  GatewayDispatchEvents,
  PermissionFlagsBits,
  PermissionsBitField,
} from "discord.js";
import API from "revolt-api";
import {
  internalStatus, Member, Status, fromSnowflake, toSnowflake, createUserPresence,
} from "@reflectcord/common/models";
import {
  LazyRequest, GatewayDispatchCodes, LazyRange, SyncItem, LazyGroup, LazyItem,
} from "@reflectcord/common/sparkle";
import { MemberContainer } from "@reflectcord/common/managers";
import { Logger } from "@reflectcord/common/utils";
import { MemberList, calculateListId } from "@reflectcord/common/utils/discord/MemberList";
import { Payload, Dispatch } from "../util";
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

function calculateMemberPermissions(
  roles: APIRole[],
  overwrites: APIOverwrite[],
) {
  const permissions = new PermissionsBitField(roles.map((x) => x.permissions.toBigInt()));

  if (permissions.has(PermissionFlagsBits.Administrator)) {
    return new PermissionsBitField(PermissionsBitField.All);
  }

  return permissions
    .remove(overwrites.map((role) => role.deny.toBigInt()))
    .add(overwrites.map((role) => role.allow.toBigInt()));
}

async function getMembers(
  this: WebSocket,
  guild_id: string,
  range: LazyRange,
  target_channel: string,
  activities?: boolean,
  newMembers?: API.AllMemberResponse,
  fastUserFind?: boolean,
) {
  if (!Array.isArray(range) || range.length !== 2) throw new Error("invalid range");

  // Keeps track of the real info for us
  const counts = {
    online: 0, offline: 0, realOffline: 0, onlineGroup: 0,
  };

  const groups: LazyGroup[] = [];
  const items: LazyItem[] = [];
  const discordGuildId = await toSnowflake(guild_id);
  const offlineMembers: { member: API.Member, user: API.User }[] = [];
  const offlineItems: LazyItem[] = [];

  let members: API.AllMemberResponse;

  if (newMembers) members = newMembers;
  else {
    members = await this.rvAPI.get(`/servers/${guild_id as ""}/members`, {
      exclude_offline: false,
    });
    if (members.members.length > 1000) {
      members = await this.rvAPI.get(`/servers/${guild_id as ""}/members`, {
        exclude_offline: true,
      });
    }
  }

  const server = this.rvAPIWrapper.servers.get(guild_id);
  const channel = this.rvAPIWrapper.channels.get(target_channel);

  members.members = members.members.filter((m, i) => {
    const user = fastUserFind ? members.users[i] : members.users.find((u) => u._id === m._id.user);

    if (!user) return false;

    if (!user.online) {
      // Backout if we're out of range
      if (!(i > range[1] || i < range[0])) {
        offlineMembers.push({ member: m, user });

        counts.offline += 1;
      }
      counts.realOffline += 1;
    } else {
      counts.online += 1;
      if ((m.roles?.length ?? 0) <= 0) counts.onlineGroup += 1;
    }

    return user.online;
  });
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
    return (highestRank > otherHighest
      ? 0 : highestRank < otherHighest ? -1 : 1);
  });

  if (newMembers) {
    members.members = members.members.slice(range[0], range[1]);
    // offlineMembers = offlineMembers.slice(range[0], range[1]);
  }

  type extendMemberContainer = MemberContainer & {
    user?: API.User | undefined | null,
    status?: internalStatus | null,
  }

  let discordMembers: extendMemberContainer[] = await Promise.all(members.members
    .map(async (member, i) => {
      const user = members.users.find((x) => x._id === member._id.user);

      const discordMember = await Member.from_quark(member, { user });

      if (discordMember.roles?.length <= 0) discordMember.roles.push(discordGuildId);

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
    memberRoles.splice(
      memberRoles.findIndex((x) => x === discordGuildId),
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
    const group: SyncItem = {
      count: role === discordGuildId ? counts.onlineGroup : role_members.length,
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

  offlineItems.push(...await Promise.all(offlineMembers
    .map(async (member) => {
      const discordMember = await Member.from_quark(member.member, { user: member.user });

      const { status } = member.user;

      const discordStatus = await Status.from_quark(status, { online: member.user.online });

      return {
        member: {
          ...discordMember,
          presence: {
            activities: activities ? discordStatus?.activities as any : [],
            client_status: {
              web: "offline",
            },
            status: "offline" as any,
            user: { id: discordMember.user!.id },
          },
        },
      };
    })));

  if (offlineItems.length > 0) {
    const group = {
      count: counts.realOffline,
      id: "offline",
    };
    items.push({ group });
    groups.push(group);

    items.push(...offlineItems);
  }

  return {
    results: {
      items: items.slice(range[0], range[1]),
      groups,
      range,
      members: items
        .map((x) => ("member" in x ? { ...x.member, settings: undefined } : undefined))
        .filter((x) => !!x),
      counts,
    },
    extendedMembers,
  };
}

function subscribeToMember(this: WebSocket, server: string, id: string) {
  if (this.events[id]) return false; // already subscribed as friend
  if (this.member_events[id]) return false; // already subscribed in member list
  if (this.subscribed_servers[server]?.members?.includes(id)) return false;
  this.subscribed_servers[server]?.members?.push(id);

  return true;
}

// FIXME: Partially implemented
export async function lazyReq(this: WebSocket, data: Payload<LazyRequest>) {
  check.call(this, LazyRequest, data.d);

  const {
    guild_id, typing, channels, activities, threads, members,
  } = data.d!;

  const rvServerId = await fromSnowflake(guild_id);
  // eslint-disable-next-line no-multi-assign
  const subscribedServer = this.subscribed_servers[rvServerId] ??= {};
  subscribedServer.members ??= [];
  // eslint-disable-next-line no-multi-assign
  const memberList = subscribedServer.memberList ??= new MemberList(guild_id, "everyone");

  const server = this.rvAPIWrapper.servers.get(rvServerId);
  if (!server) throw new Error(`Server ${server} is not in RVAPI cache`);

  // https://github.com/fosscord/fosscord-server/blob/76c85f7181cf5116b8f4ccd9015d1df371eb9c01/src/gateway/opcodes/LazyRequest.ts#L218
  if (members) {
    await Promise.all(members.map(async (id) => {
      const rvMemberId = await fromSnowflake(id);
      const alreadySubscribed = subscribeToMember.call(
        this,
        rvServerId,
        rvMemberId,
      );
      if (!alreadySubscribed) return;

      const user = await this.rvAPIWrapper.users.fetch(rvMemberId);

      const presence = await createUserPresence({
        user: user.revolt,
        discordUser: user.discord,
        server: server.revolt._id,
      });

      await Dispatch(this, GatewayDispatchEvents.PresenceUpdate, presence);
    }));

    if (!channels) return;
  }

  if (activities !== undefined) subscribedServer.activities = activities;
  if (typing !== undefined) subscribedServer.typing = typing;
  if (threads !== undefined) subscribedServer.threads = threads;

  if (!channels) {
    Logger.warn("FIXME: weird op14 behavior by newer clients");
    return;
  }

  const channel_id = Object.keys(channels || {}).first();
  if (!channel_id) return;

  const rvChannelId = await fromSnowflake(channel_id);

  const channel = this.rvAPIWrapper.channels.get(rvChannelId);
  if (!channel) throw new Error(`channel ${rvChannelId} is not cached`);

  // eslint-disable-next-line no-multi-assign
  const lazyChannel = this.lazy_channels[rvChannelId] ??= {};
  lazyChannel.messages = true;

  const ranges = channels[channel_id];
  if (!Array.isArray(ranges)) throw new Error("Not a valid Array");

  let excludeOffline = false;
  let rvMembers = await this.rvAPI.get(`/servers/${rvServerId as ""}/members`, {
    exclude_offline: excludeOffline,
  });
  const member_count = rvMembers.members.length;
  // Actually, discord doesn't even care about offline members if its large enough
  if (rvMembers.members.length > 1000) {
    excludeOffline = true;
    rvMembers = await this.rvAPI.get(`/servers/${rvServerId as ""}/members`, {
      exclude_offline: excludeOffline,
    });
  }

  const newOps = await Promise.all(ranges.map(async (range) => {
    const op = await getMembers
      .call(
        this,
        rvServerId,
        range,
        rvChannelId,
        this.subscribed_servers[rvServerId]?.activities,
        { ...rvMembers }, // Clone so that it doesnt throw up
        excludeOffline,
      );

    return op;
  }));

  const groups = newOps.map((x) => x.results.groups)
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

  const onlineCount = newOps[0]?.results.counts.online ?? 0;
  newOps.forEach((x) => {
    x.extendedMembers.forEach((member) => subscribeToMember
      .call(this, member.revolt._id.server, member.revolt._id.user));
    memberList.sync(x.results.range, x.results.items);
  });
  memberList.setGroups(groups);
  memberList.onlineCount = onlineCount;
  memberList.memberCount = member_count;

  const listId = "permission_overwrites" in channel.discord ? (() => {
    const perms: string[] = [];
    channel.discord.permission_overwrites.forEach((x) => {
      const { id, allow, deny } = x;

      if (allow.toBigInt() & PermissionFlagsBits.ViewChannel) perms.push(`allow:${id}`);
      else if (deny.toBigInt() & PermissionFlagsBits.ViewChannel) perms.push(`deny:${id}`);
    });

    return perms.length > 0 ? calculateListId(perms.sort().join(",")).toString() : "everyone";
  })() : "everyone";

  await Dispatch(this, GatewayDispatchCodes.GuildMemberListUpdate, {
    ops: newOps.map((x) => ({
      op: "SYNC",
      items: x.results.items,
      range: x.results.range,
    })),
    online_count: onlineCount,
    member_count,
    id: listId,
    guild_id,
    groups,
  });
}
