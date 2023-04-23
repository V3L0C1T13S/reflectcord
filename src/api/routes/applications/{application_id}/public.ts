/* eslint-disable camelcase */
import { HTTPError } from "@reflectcord/common/utils";
import { Resource } from "express-automatic-routes";
import { Application, fromSnowflake } from "@reflectcord/common/models";

export default () => <Resource> {
  get: async (req, res) => {
    const { application_id } = req.params;
    if (!application_id) throw new HTTPError("Invalid appid");

    const appid = await fromSnowflake(application_id);

    const bot = await res.rvAPI.get(`/bots/${appid as ""}`);

    res.json(await Application.from_quark(bot.bot, {
      user: bot.user,
    }));
  },
};
