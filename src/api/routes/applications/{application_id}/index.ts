/* eslint-disable camelcase */
import { APIApplication } from "discord.js";
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Application as botApplication } from "../../../../common/models";
import { createAPI } from "../../../../common/rvapi";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const { application_id } = req.params;

    const api = createAPI(req.token);

    const bot = await api.get(`/bots/${application_id}`) as API.BotResponse;

    return res.json(await botApplication.from_quark(bot.bot)).status(200);
  },
};
