import { APIBan } from "discord.js";
import { API } from "revolt.js";
import { QuarkConversion } from "../../QuarkConversion";
import { User } from "../user";

export type BanATQ = Partial<{
  server: string,
}>

export type BanAFQ = Partial<{
  user: API.User,
}>

export const Ban: QuarkConversion<API.ServerBan, APIBan, BanATQ, BanAFQ> = {
  async to_quark(ban, extra) {
    return {
      reason: ban.reason,
      _id: {
        user: ban.user.id,
        server: extra?.server ?? "0",
      },
    };
  },

  async from_quark(ban, extra) {
    const { reason, _id } = ban;

    return {
      reason: reason ?? null,
      user: extra?.user ? await User.from_quark(extra.user) : await User.from_quark({
        _id: _id.user,
        username: "fixme",
      }),
    };
  },
};
