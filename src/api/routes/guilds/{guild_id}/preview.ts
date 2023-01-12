/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { fromSnowflake } from "@reflectcord/common/models";

// FIXME
export default () => <Resource> {
  get: async (req, res) => {
    const { guild_id } = req.params;
    if (!guild_id) throw new HTTPError("Invalid params");

    const rvId = await fromSnowflake(guild_id);

    const server = await res.rvAPIWrapper.servers.fetch(rvId);
    res.json({
      approximate_member_count: server.discord.approximate_member_count,
      approximate_presence_count: server.discord.approximate_presence_count,
      description: server.discord.description,
      discovery_splash: server.discord.discovery_splash,
      emojis: server.discord.emojis,
      features: server.discord.features,
      home_header: "939358380fe7716c1dbc34de73b900a3",
      id: server.discord.id,
      name: server.discord.name,
      splash: server.discord.splash,
      stickers: server.discord.stickers,
    });
  },
};
