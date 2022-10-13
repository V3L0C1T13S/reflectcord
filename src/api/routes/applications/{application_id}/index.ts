/* eslint-disable camelcase */
import { APIApplication } from "discord.js";
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Application as botApplication, OwnedApplication } from "../../../../common/models";
import { createAPI } from "../../../../common/rvapi";

export default (express: Application) => <Resource> {
  get: async (req, res: Response<APIApplication>) => {
    const { application_id } = req.params;

    const api = createAPI(req.token);

    const bot = await api.get(`/bots/${application_id}`) as API.BotResponse;

    return res.json(await OwnedApplication.from_quark(bot));
  },
  patch: async (req, res) => {
    const { application_id } = req.params;
    if (!application_id) return;

    const api = createAPI(req.token);

    const revoltRes = await api.patch(`/bots/${application_id}`, {
      description: req.body.description,
    }).catch(() => {
      res.sendStatus(500);
    }) as API.Bot;
    if (!revoltRes) return;

    return res.json(await botApplication.from_quark(revoltRes));
  },
};
