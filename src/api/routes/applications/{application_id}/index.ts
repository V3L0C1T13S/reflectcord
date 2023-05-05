/* eslint-disable camelcase */
import { APIApplication } from "discord.js";
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { HTTPError } from "@reflectcord/common/utils";
import { Application as botApplication, OwnedApplication, fromSnowflake } from "@reflectcord/common/models";

export default () => <Resource> {
  get: async (req, res: Response<APIApplication>) => {
    const { application_id } = req.params;
    if (!application_id) throw new HTTPError("Invalid appid");

    const appid = await fromSnowflake(application_id);

    const bot = await res.rvAPI.get(`/bots/${appid as ""}`);
    const profileInfo = await res.rvAPI.get(`/users/${bot.user._id as ""}/profile`);

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

    const revoltRes = await res.rvAPI.patch(`/bots/${appid as ""}`, {
      name: req.body.username ?? null,
      // bio: req.body.description,
    });

    return res.json(await botApplication.from_quark(revoltRes));
  },
  delete: (req, res) => {
    throw new HTTPError("unimplemented");
  },
};
