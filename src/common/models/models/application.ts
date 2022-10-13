import { APIApplication } from "discord.js";
import { Bot } from "revolt-api";
import { QuarkConversion } from "../QuarkConversion";

export const Application: QuarkConversion<Bot, APIApplication> = {
  async to_quark(bot) {
    const {
      id, owner,
    } = bot;

    return {
      _id: id,
      owner: owner?.id!,
      token: "",
      public: bot.bot_public,
      analytics: false,
      discoverable: false,
    };
  },

  async from_quark(bot) {
    const {
      _id, owner, token,
    } = bot;
    return {
      id: _id,
      description: "fixme",
      bot_public: bot.public,
      verify_key: "fixme",
      flags: 0,
      name: "fixme",
      icon: null,
      bot_require_code_grant: false,
      summary: "fixme",
      team: null,
      owner: {
        id: owner,
        username: "fixme",
        discriminator: "1",
        avatar: null,
      },
    };
  },
};
