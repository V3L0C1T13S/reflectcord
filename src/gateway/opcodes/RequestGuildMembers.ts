/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import {
  GatewayOpcodes, GatewayDispatchEvents,
} from "discord.js";
import { compareTwoStrings } from "string-similarity";
import { API } from "revolt.js";
import { clamp } from "lodash";
import { Payload, Send } from "../util";
import { fromSnowflake } from "../../common/models/util";
import { WebSocket } from "../Socket";
import { Member, Status, User } from "../../common/models";
import { check } from "./instanceOf";
import { ReqGuildMembersSchema, GuildMembersChunk } from "../../common/sparkle";

const memberExists = (uid: string, member_ids: string[]) => member_ids.includes(uid);

async function HandleRequest(
  this: WebSocket,
  guildId: string,
  members: API.AllMemberResponse,
  presences?: boolean,
  user_ids?: string[] | string,
  query?: string,
  nonce?: string,
  limit = 1000,
) {
  members.members.splice(limit);
  members.users.splice(limit);

  const body: GuildMembersChunk = {
    guild_id: guildId,
    members: [],
  };

  const discordMembers = (await Promise.all(members.members
    .map((x) => Member.from_quark(x, members.users.find((u) => u._id === x._id.user)))));

  if (user_ids) {
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
  } else if (query) {
    // Empty string means get all members
    if (query !== "") {
      const membersQuery = discordMembers
        .filter((x) => x.user && (compareTwoStrings(x.user.username, query) >= 0.8));

      body.members = membersQuery;
    }
  }

  if (presences) {
    const discordPresences = await Promise.all(members.users.map(async (x) => {
      const status = await Status.from_quark(x.status);
      const discordPresence = {
        user: await User.from_quark(x),
        guild_id: guildId,
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

export async function RequestGuildMembers(
  this: WebSocket,
  data: Payload<ReqGuildMembersSchema>,
) {
  check.call(this, ReqGuildMembersSchema, data.d);

  const reqData = data.d!;
  const {
    guild_id, presences, nonce, user_ids, query, limit,
  } = reqData;

  const maxMembers = limit ? clamp(limit, 1, 1000) : undefined;

  if (typeof guild_id === "string") {
    const rvId = await fromSnowflake(guild_id);
    const members = await this.rvAPI.get(`/servers/${rvId as ""}/members`, {
      exclude_offline: false,
    });
    await HandleRequest.call(
      this,
      guild_id,
      members,
      presences,
      user_ids,
      query,
      nonce,
      maxMembers,
    );
  } else {
    await Promise.all(guild_id.map(async (x) => {
      const rvId = await fromSnowflake(x);
      const members = await this.rvAPI.get(`/servers/${rvId as ""}/members`, {
        exclude_offline: false,
      });
      await HandleRequest.call(this, x, members, presences, user_ids, query, nonce, maxMembers);
    }));
  }
}
