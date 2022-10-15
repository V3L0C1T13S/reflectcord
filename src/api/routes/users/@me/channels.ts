import { APIChannel } from "discord.js";
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Channel } from "../../../../common/models";

export default (express: Application) => <Resource> {
  get: async (req, res: Response<APIChannel[]>) => {
    const rvDms = await res.rvAPI.get("/users/dms").catch(() => {}) as API.Channel[];
    if (!rvDms) return res.sendStatus(500);

    const discordDMS = await Promise.all(rvDms
      .map((channel) => Channel.from_quark(channel)));

    return res.json(discordDMS);
  },
};
