/* eslint-disable camelcase */
import { APIGuildMember } from "discord.js";
import { Member as RevoltMember } from "revolt-api";
import { QuarkConversion } from "../QuarkConversion";
import { toSnowflake } from "../util";
import { User } from "./user";

export const Member: QuarkConversion<RevoltMember, APIGuildMember> = {
  async to_quark(member) {
    const { user } = member;

    return {
      _id: {
        server: "0",
        user: user?.id ?? "0",
      },
      joined_at: member.joined_at,
      nickname: member.nick ?? null,
      timeout: member.communication_disabled_until ?? null,
    };
  },

  async from_quark(member) {
    const {
      _id, joined_at, nickname, timeout, roles,
    } = member;

    const convRoles = roles
      ? await Promise.all(roles.map((x) => toSnowflake(x)))
      : [];

    return {
      id: await toSnowflake(_id.user),
      joined_at,
      communication_disabled_until: timeout ?? null,
      roles: convRoles,
      deaf: false,
      mute: false,
      nick: nickname ?? null,
      user: await User.from_quark({
        _id: _id.user,
        username: member.nickname ?? "fixme",
        avatar: member.avatar ?? null,
      }),
    };
  },
};
