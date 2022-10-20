/* eslint-disable camelcase */
import { APIApplication } from "discord.js";
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { HTTPError } from "../../../../common/utils";
import { Application as botApplication, OwnedApplication } from "../../../../common/models";
import { fromSnowflake } from "../../../../common/models/util";

export default (express: Application) => <Resource> {
  get: async (req, res: Response<APIApplication>) => {
    const { application_id } = req.params;
    if (!application_id) throw new HTTPError("Invalid appid");

    const appid = await fromSnowflake(application_id);

    const bot = await res.rvAPI.get(`/bots/${appid}`) as API.BotResponse;
    const profileInfo = await res.rvAPI.get(`/users/${bot.user._id}/profile`) as API.UserProfile;
    if (!bot || !profileInfo) throw new HTTPError("Revolt failed to get bot", 500);

    return res.json(await OwnedApplication.from_quark({
      bot: bot.bot,
      user: {
        ...bot.user,
        profile: profileInfo,
      },
    }));
  },
  patch: async (req, res) => {
    const { application_id } = req.params;
    if (!application_id) throw new HTTPError("Invalid appid");

    const appid = await fromSnowflake(application_id);

    const revoltRes = await res.rvAPI.patch(`/bots/${appid}`, {
      description: req.body.description,
    }) as API.Bot;
    if (!revoltRes) return;

    return res.json(await botApplication.from_quark(revoltRes));
  },
  delete: (req, res) => {
    throw new HTTPError("unimplemented");
  },
};
