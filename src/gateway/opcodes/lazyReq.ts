/* eslint-disable no-restricted-syntax */
/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import { APIGuildMember, GatewayOpcodes } from "discord.js";
import { API } from "revolt.js";
import { Member } from "../../common/models";
import { Send, Payload } from "../util";
import { WebSocket } from "../Socket";
import { fromSnowflake } from "../../common/models/util";

function partition<T>(array: T[], isValid: Function) {
  // @ts-ignore
  return array.reduce(
    // @ts-ignore
    ([pass, fail], elem) => (isValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]]),
    [[], []],
  );
}

async function getMembers(this: WebSocket, guild_id: string, range: [number, number]) {
  if (!Array.isArray(range) || range.length !== 2) throw new Error("invalid range");

  const members = await this.rvAPI.get(`/servers/${guild_id}/members`, {
    exclude_offline: true,
  }) as API.AllMemberResponse;

  let discordMember = await Promise.all(members.members
    .map((m) => Member.from_quark(m)));

  const groups: any[] = [];
  const items: any[] = [];
  const roles = discordMember
    .map((m) => m.roles)
    .flat()
    .unique((r) => r);
  roles.push(
    roles.splice(
      roles.findIndex((x) => x === guild_id),
      1,
    )[0]!,
  );

  for (const role of roles) {
    // @ts-ignore
    const [role_members, other_members]: [APIGuildMember[], APIGuildMember[]] = partition(
      discordMember,
      (m: APIGuildMember) => m.roles
        .find((r) => r === role),
    );
    const group = {
      count: role_members.length,
      id: role === guild_id ? "online" : role,
    };

    items.push({ group });
    groups.push(group);

    for (const member of role_members) {
      const memberRoles = member.roles.filter((x) => x !== guild_id).map((x) => x);

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
          roles,
          user: { ...member.user, sessions: undefined },
          presence: {
            ...session,
            activities: [],
            user: { id: member.user?.id },
          },
        },
      };

      items.push(item);
    }
    discordMember = other_members;
  }

  return {
    items,
    groups,
    range,
    members: items.map((x) => ("member" in x ? x.member : undefined)).filter((x) => !!x),
  };
}

export async function lazyReq(this: WebSocket, data: Payload) {
  const {
    guild_id, typing, channels, activities,
  } = data.d;

  console.log(JSON.stringify(channels));

  const channel_id = Object.keys(channels)[0];
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
      online_count: 0,
      member_count,
      id: "everyone",
      guild_id,
      groups,
    },
  });
}
