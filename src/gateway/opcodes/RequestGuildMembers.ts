/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import {
  GatewayDispatchEvents,
} from "discord.js";
import API from "revolt-api";
import { clamp } from "lodash";
import {
  createUserPresence,
  fromSnowflake, Member, multipleFromSnowflake, multipleToSnowflake, User,
} from "@reflectcord/common/models";
import { ReqGuildMembersSchema, GuildMembersChunk } from "@reflectcord/common/sparkle";
import rfcNative from "rfcNative";
import { Dispatch, Payload } from "../util";
import { WebSocket } from "../Socket";
import { check } from "./instanceOf";

// const memberExists = (uid: string, member_ids: string[]) => member_ids.includes(uid);

async function HandleRequest(
  this: WebSocket,
  guildId: string,
  members: API.AllMemberResponse,
  presences?: boolean,
  user_ids?: string[] | string,
  query?: string,
  nonce?: string,
  chunk_index = 0,
  chunk_count = 1,
  limit = 1000,
) {
  if (limit) {
    members.members.splice(limit);
    members.users.splice(limit);
  }

  const body: GuildMembersChunk = {
    chunk_index,
    chunk_count,
    guild_id: guildId,
    members: [],
  };

  if (nonce) body.nonce = nonce;

  const rvServer = await fromSnowflake(guildId);
  const server = this.rvAPIWrapper.servers.get(rvServer);

  if (!server?.extra?.members) throw new Error(`${rvServer} not in cache`);

  const rvUserIds = user_ids
    ? await multipleFromSnowflake(Array.isArray(user_ids) ? user_ids : [user_ids])
    : null;

  if (user_ids && rvUserIds) {
    const found: { member: API.Member, user: API.User }[] = [];
    members.members.forEach((member, i) => {
      if (rvUserIds.includes(member._id.user)) found.push({ member, user: members.users[i]! });
    });
    const notFound = rvUserIds.filter((id) => !found.find((m) => m.user._id === id));
    /*
    const nativeResults = rfcNative.processOP8({
      discord_members: discordMembers,
      user_ids: Array.isArray(user_ids) ? user_ids : [user_ids],
      guild_id: [guildId],
      presences: !!presences,
      query: "",
    });
    */

    body.not_found = await multipleToSnowflake(notFound);
    body.members = await Promise.all(found
      .map(async (m, i) => {
        const user = this.rvAPIWrapper.users.get(m.user._id)
          ?? this.rvAPIWrapper.users.createObj({
            revolt: m.user,
            discord: await User.from_quark(m.user),
          });
        const member = server.extra!.members.createObj({
          revolt: m.member,
          discord: await Member.from_quark(m.member, { discordUser: user.discord }),
        });

        return member.discord;
      }));
  } else if (query) {
    // Empty string means get all members
    if (query !== "") {
      const discordMembers = (await Promise.all(members.members
        .map(async (x, i) => {
          const member = await Member.from_quark(x, { user: members.users[i] });
          // @ts-ignore - Refcord native uses a special member.id property
          member.id = member.user?.id ?? "0";

          return member;
        })));

      const nativeResults = rfcNative.processOP8({
        discord_members: discordMembers,
        user_ids: [],
        guild_id: [guildId],
        presences: !!presences,
        query,
      });

      body.members = nativeResults.results.members;
    }
  }

  // TODO: Move to native code
  if (presences) {
    const discordPresences = await Promise.all(members.users.map(async (x) => {
      const userObj = this.rvAPIWrapper.users.createObj({
        revolt: x,
        discord: await User.from_quark(x),
      });
      const discordPresence = await createUserPresence({
        user: userObj.revolt,
        discordUser: userObj.discord,
        guild_id: guildId,
      });

      return discordPresence;
    }));

    body.presences = discordPresences;
  }

  await Dispatch(this, GatewayDispatchEvents.GuildMembersChunk, body);
}

export async function RequestGuildMembers(
  this: WebSocket,
  data: Payload<ReqGuildMembersSchema>,
) {
  check.call(this, ReqGuildMembersSchema, data.d);

  const {
    guild_id, presences, nonce, user_ids, query, limit,
  } = data.d!;

  const maxMembers = limit ? clamp(limit, 1, 1000) : undefined;

  await Promise.all((Array.isArray(guild_id) ? guild_id : [guild_id]).map(async (x) => {
    const rvId = await fromSnowflake(x);
    const members = await this.rvAPI.get(`/servers/${rvId as ""}/members`, {
      exclude_offline: false,
    });
    /*
    if (limit) {
      members.members.splice(limit);
      members.users.splice(limit);
    }
    // incorrect chunking lol - we need to only send wanted members in the chunk
    const memberChunks = chunk(members.members, 1000);
    const userChunks = chunk(members.users, 1000);
    await Promise.all(memberChunks.map((memberChunk, i) => HandleRequest.call(
      this,
      x,
      {
        members: memberChunk,
        users: userChunks[i]!,
      },
      presences,
      user_ids,
      query,
      nonce,
      i,
      memberChunks.length,
      maxMembers,
    )));
    */
    await HandleRequest
      .call(this, x, members, presences, user_ids, query, nonce, undefined, undefined, maxMembers);
  }));
}
