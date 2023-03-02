/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
import {
  APIGuildMember, APIUser, RESTPatchAPIGuildMemberJSONBody, GuildMemberFlags,
} from "discord.js";
import { Member as RevoltMember } from "revolt-api";
import { API } from "revolt.js";
import { QuarkConversion } from "../QuarkConversion";
import {
  fromSnowflake, multipleFromSnowflake, multipleToSnowflake, toSnowflake,
} from "../util";
import { User } from "./user";
import { toCompatibleISO } from "../../utils/date";
import { PartialFile } from "./attachment";

export type MemberATQ = Partial<{
  user: APIUser,
}>;

export type MemberAFQ = Partial<{
  user: API.User | null | undefined,
  discordUser: APIUser | null | undefined,
}>;

export const Member: QuarkConversion<RevoltMember, APIGuildMember, APIUser, MemberAFQ> = {
  async to_quark(member) {
    const {
      user, joined_at, nick, communication_disabled_until, roles,
    } = member;

    return {
      _id: {
        server: "0",
        user: user?.id ? await fromSnowflake(user?.id) : "0",
      },
      joined_at,
      nickname: nick ?? null,
      timeout: communication_disabled_until ?? null,
      roles: await multipleFromSnowflake(roles),
    };
  },

  async from_quark(member, extra) {
    const {
      _id, joined_at, nickname, timeout, roles,
    } = member;

    const user = extra?.discordUser
      ? extra.discordUser
      : extra?.user
        ? await User.from_quark(extra.user)
        : await User.from_quark({
          _id: _id.user,
          username: member.nickname ?? "fixme",
          avatar: member.avatar ?? null,
        });
    const discordAvatar = member.avatar ? await PartialFile.from_quark(member.avatar) : null;

    const discordMember: APIGuildMember = {
      // id: await toSnowflake(_id.user),
      joined_at: toCompatibleISO(new Date(joined_at).toISOString()),
      communication_disabled_until: timeout
        ? toCompatibleISO(new Date(timeout).toISOString())
        : null,
      roles: roles ? await multipleToSnowflake(roles) : [],
      deaf: false,
      mute: false,
      nick: nickname ?? null,
      avatar: discordAvatar,
      pending: false,
      user,
      flags: 0,
    };

    return discordMember;
  },
};

export const MemberEditBody: QuarkConversion<
API.DataMemberEdit,
RESTPatchAPIGuildMemberJSONBody
> = {
  async to_quark(data) {
    const { nick, roles, communication_disabled_until } = data;

    const remove: API.FieldsMember[] = [];

    if (nick === "") remove.push("Nickname");
    if (communication_disabled_until === undefined) remove.push("Timeout");

    const body: API.DataMemberEdit = {
      nickname: nick || null,
      roles: roles ? await multipleFromSnowflake(roles) : null,
      timeout: communication_disabled_until ?? null,
    };

    if (remove.length > 0) body.remove = remove;

    return body;
  },

  async from_quark(data) {
    const {
      nickname, roles, remove, timeout,
    } = data;

    return {
      nick: nickname,
      roles: roles ? await multipleToSnowflake(roles) : null,
      communication_disabled_until: timeout,
    };
  },
};
