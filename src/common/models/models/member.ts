/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
import {
  APIGuildMember,
  APIRole,
  APIUser,
  GuildMemberFlags,
  GuildMemberFlagsBitField,
  RESTPatchAPIGuildMemberJSONBody,
} from "discord.js";
import { Member as RevoltMember } from "revolt-api";
import { API } from "revolt.js";
import { QuarkConversion } from "../QuarkConversion";
import {
  fromSnowflake, multipleFromSnowflake, multipleToSnowflake,
} from "../util";
import { User } from "./user";
import { toCompatibleISO } from "../../utils/date";
import { PartialFile } from "./attachment";
import { MergedMember } from "../../sparkle";

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
    const discordAvatar = member.avatar
      ? await PartialFile.from_quark(member.avatar, { skipConversion: true })
      : null;

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
      flags: new GuildMemberFlagsBitField().toJSON(),
    };

    return discordMember;
  },
};

export class MergedMemberDTO implements MergedMember {
  hoisted_role?: APIRole;
  nick?: string | null;
  avatar?: string | null;
  roles: string[];
  joined_at: string;
  premium_since?: string | null;
  deaf: boolean;
  mute: boolean;
  flags: GuildMemberFlags;
  pending?: boolean;
  communication_disabled_until?: string | null;
  user_id: string;

  constructor(member: APIGuildMember, user_id: string, extra?: {
    guild_roles?: APIRole[],
  }) {
    this.user_id = user_id;

    if ("nick" in member) this.nick = member.nick;
    if ("avatar" in member) this.avatar = member.avatar;
    this.roles = member.roles;
    this.joined_at = member.joined_at;
    if ("premium_since" in member) this.premium_since = member.premium_since;
    this.deaf = member.deaf;
    this.mute = member.mute;
    this.flags = member.flags;
    if (member.pending) this.pending = member.pending;
    if ("communication_disabled_until" in member) {
      this.communication_disabled_until = member.communication_disabled_until;
    }

    if (extra?.guild_roles) {
      const hoisted_role = this.findHighestHoistedRole(extra.guild_roles);

      if (hoisted_role) this.hoisted_role = hoisted_role;
    }
  }

  findHighestHoistedRole(roles: APIRole[]) {
    const hoistedRoles = roles
      .filter((role) => role.hoist && this.roles
        .find((member_role) => member_role === role.id));

    /**
     * FIXME: When we eventually sort role positions correctly,
     * this code will need to be adjusted
    */
    const hoisted_role = hoistedRoles
      .sort((r1, r2) => r1.position - r2.position)[0];

    return hoisted_role;
  }
}

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
