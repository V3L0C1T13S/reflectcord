import { APIApplication, APIUser } from "discord.js";
import { Bot, BotResponse } from "revolt-api";
import { API } from "revolt.js";
import { QuarkConversion } from "../QuarkConversion";
import { fromSnowflake, toSnowflake } from "../util";
import { User } from "./user";

export type ApplicationATQ = {};
export type ApplicationAFQ = Partial<{
  user: API.User,
}>;

export const Application: QuarkConversion<Bot, APIApplication, ApplicationATQ, ApplicationAFQ> = {
  async to_quark(bot) {
    const {
      id, owner,
    } = bot;

    return {
      _id: await fromSnowflake(id),
      owner: owner ? await fromSnowflake(owner.id) : "0",
      token: "",
      public: bot.bot_public,
      analytics: false,
      discoverable: false,
    };
  },

  async from_quark(bot, extra) {
    const {
      _id, owner, token,
    } = bot;
    return {
      id: await toSnowflake(_id),
      description: extra?.user?.profile?.content ?? "",
      bot_public: bot.public,
      verify_key: "fixme",
      flags: 0,
      name: extra?.user?.username ?? "fixme",
      icon: extra?.user?.avatar?._id ?? null,
      bot_require_code_grant: false,
      summary: "",
      team: null,
      owner: {
        id: await toSnowflake(owner),
        username: "fixme",
        discriminator: "1",
        avatar: null,
      },
      rpc_application_state: 0,
      redirect_uris: [],
      hook: true,
    };
  },
};

interface OwnedAPIApplication extends APIApplication {
  bot?: APIUser;
}

export const OwnedApplication: QuarkConversion<BotResponse, OwnedAPIApplication> = {
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

    const app: OwnedAPIApplication = {
      ...await Application.from_quark(bot),
      name: username,
      description: user.profile?.content ?? "",
      icon: user.avatar?._id ?? null,
      summary: user.profile?.content ?? "",
      bot: await User.from_quark(user),
    };

    return app;
  },
};
