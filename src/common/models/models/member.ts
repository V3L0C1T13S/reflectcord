/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
import { APIGuildMember, APIUser, RESTPatchAPIGuildMemberJSONBody } from "discord.js";
import { Member as RevoltMember } from "revolt-api";
import { API } from "revolt.js";
import { QuarkConversion } from "../QuarkConversion";
import { fromSnowflake, hashToSnowflake, toSnowflake } from "../util";
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
      roles: await Promise.all(roles.map((x) => fromSnowflake(x))),
    };
  },

  async from_quark(member, extra) {
    const {
      _id, joined_at, nickname, timeout, roles,
    } = member;

    const convRoles = roles
      ? await Promise.all(roles.map((x) => toSnowflake(x)))
      : [];

    const discordAvatar = member.avatar ? await PartialFile.from_quark(member.avatar) : null;

    return {
      // id: await toSnowflake(_id.user),
      joined_at: toCompatibleISO(new Date(joined_at).toISOString()),
      communication_disabled_until: timeout
        ? toCompatibleISO(new Date(timeout).toISOString())
        : null,
      roles: convRoles,
      deaf: false,
      mute: false,
      nick: nickname ?? null,
      avatar: discordAvatar,
      pending: false,
      user: extra?.discordUser
        ? extra.discordUser
        : extra?.user
          ? await User.from_quark(extra.user)
          : await User.from_quark({
            _id: _id.user,
            username: member.nickname ?? "fixme",
            avatar: member.avatar ?? null,
          }),
    };
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

    const body: API.DataMemberEdit = {
      nickname: nick || null,
      remove: remove.length > 0 ? remove : null,
      roles: roles ? await Promise.all(roles.map((x) => fromSnowflake(x))) : null,
      timeout: communication_disabled_until ?? null,
    };

    return body;
  },

  async from_quark(data) {
    const {
      nickname, roles, remove, timeout,
    } = data;

    return {
      nick: nickname,
      roles: roles ? await Promise.all(roles.map((x) => toSnowflake(x))) : null,
      communication_disabled_until: timeout,
    };
  },
};
