import { APIChannel } from "discord.js";
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Channel } from "../../../../common/models";
import { createAPI } from "../../../../common/rvapi";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const api = createAPI(req.token);

    const rvDms = await api.get("/users/dms") as API.Channel[];
    if (!rvDms) return;

    const discordDMS = await Promise.all(rvDms
      .map((channel) => Channel.from_quark(channel)));

    res.json(discordDMS);
  },
};
