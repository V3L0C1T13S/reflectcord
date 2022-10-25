import { APIBan } from "discord.js";
import { API } from "revolt.js";
import { QuarkConversion } from "../../QuarkConversion";
import { User } from "../user";

export const Ban: QuarkConversion<API.ServerBan, APIBan> = {
  async to_quark(ban) {
    return {
      reason: ban.reason,
      _id: {
        user: ban.user.id,
        server: "0",
      },
    };
  },

  async from_quark(ban) {
    const { reason, _id } = ban;

    return {
      reason: reason ?? null,
      user: await User.from_quark({
        _id: _id.user,
        username: "fixme",
      }),
    };
  },
};
