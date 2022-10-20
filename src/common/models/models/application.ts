import { APIApplication } from "discord.js";
import { Bot, BotResponse } from "revolt-api";
import { QuarkConversion } from "../QuarkConversion";
import { toSnowflake } from "../util";
import { User } from "./user";

export const Application: QuarkConversion<Bot, APIApplication> = {
  async to_quark(bot) {
    const {
      id, owner,
    } = bot;

    return {
      _id: id,
      owner: owner?.id ?? "0",
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
      id: await toSnowflake(_id),
      description: "",
      bot_public: bot.public,
      verify_key: "fixme",
      flags: 0,
      name: "fixme",
      icon: null,
      bot_require_code_grant: false,
      summary: "",
      team: null,
      owner: {
        id: await toSnowflake(owner),
        username: "fixme",
        discriminator: "1",
        avatar: null,
      },
    };
  },
};

export const OwnedApplication: QuarkConversion<BotResponse, APIApplication> = {
  async to_quark(data) {
    const { id, name } = data;

    return {
      bot: await Application.to_quark(data),
      user: {
        _id: id,
        username: name,
      },
    };
  },

  async from_quark(data) {
    const { bot, user } = data;

    const discordUser = await User.from_quark(user);

    const { username } = discordUser;

    const app: APIApplication = {
      ...await Application.from_quark(bot),
      name: username,
      description: user.profile?.content ?? "",
      icon: user.avatar?._id ?? null,
      summary: user.profile?.content ?? "",
    };

    return app;
  },
};
