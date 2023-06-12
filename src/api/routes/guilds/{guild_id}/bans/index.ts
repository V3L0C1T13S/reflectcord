/* eslint-disable camelcase */
import { APIBan } from "discord.js";
import { Response } from "express";
import { Resource } from "express-automatic-routes";
import { Ban, fromSnowflake } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

export default () => <Resource> {
  get: async (req, res: Response<APIBan[]>) => {
    const { guild_id } = req.params;
    if (!guild_id) throw new HTTPError("Invalid params");

    const rvId = await fromSnowflake(guild_id);

    const bans = await res.rvAPI.get(`/servers/${rvId as ""}/bans`);

    const discordBans = await Promise.all(bans.bans.map((ban) => {
      const user = bans.users.find((x) => x._id === ban._id.user);

      return Ban.from_quark(ban, {
        user: user ? {
          ...user,
          discriminator: "0001",
        } : null,
      });
    }));

    res.json(discordBans);
  },
};
