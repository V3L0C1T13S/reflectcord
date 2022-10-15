/* eslint-disable camelcase */
import { APIApplication } from "discord.js";
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Application as botApplication, OwnedApplication } from "../../../../common/models";

export default (express: Application) => <Resource> {
  get: async (req, res: Response<APIApplication>) => {
    const { application_id } = req.params;

    const bot = await res.rvAPI.get(`/bots/${application_id}`).catch(() => {}) as API.BotResponse;
    const profileInfo = await res.rvAPI.get(`/users/${bot.user._id}/profile`).catch(() => {}) as API.UserProfile;
    if (!bot || !profileInfo) return res.sendStatus(500);

    return res.json(await OwnedApplication.from_quark({
      bot: bot.bot,
      user: {
        ...bot.user,
        profile: {
          content: profileInfo.content ?? null,
        },
      },
    }));
  },
  patch: async (req, res) => {
    const { application_id } = req.params;
    if (!application_id) return;

    const revoltRes = await res.rvAPI.patch(`/bots/${application_id}`, {
      description: req.body.description,
    }).catch(() => {
      res.sendStatus(500);
    }) as API.Bot;
    if (!revoltRes) return;

    return res.json(await botApplication.from_quark(revoltRes));
  },
};
