/* eslint-disable camelcase */
import { APIGuildMember } from "discord.js";
import { Member as RevoltMember } from "revolt-api";
import { QuarkConversion } from "../QuarkConversion";

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
      _id, joined_at, nickname, timeout,
    } = member;

    return {
      id: _id.user,
      joined_at,
      communication_disabled_until: timeout ?? null,
      roles: [],
      deaf: false,
      mute: false,
    };
  },
};
