/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import {
  GatewayDispatchEvents,
} from "discord.js";
import { API } from "revolt.js";
import { clamp } from "lodash";
import {
  fromSnowflake, Member, Status, User,
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
    const nativeResults = rfcNative.processOP8({
      discord_members: discordMembers,
      user_ids: Array.isArray(user_ids) ? user_ids : [user_ids],
      guild_id: [guildId],
      presences: !!presences,
      query: "",
    });

    body.not_found = nativeResults.results.not_found;
    body.members = nativeResults.results.members;
  } else if (query) {
    // Empty string means get all members
    if (query !== "") {
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
      const status = await Status.from_quark(x.status);
      const { activities } = status;
      const discordPresence = {
        user: await User.from_quark(x),
        guild_id: guildId,
        status: status.status,
        activities,
        client_status: {
          desktop: status.status,
        },
      };

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
