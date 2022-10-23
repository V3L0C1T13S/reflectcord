/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { ChannelType as discordChannelType } from "discord.js";
import { HTTPError } from "../../../../../common/utils";
import { fromSnowflake, toSnowflake } from "../../../../../common/models/util";
import { Channel, ChannelCreateType, ChannelType } from "../../../../../common/models";

const validTypes = [discordChannelType.GuildText, discordChannelType.GuildVoice];

export default (express: Application) => <Resource> {
  post: async (req, res) => {
    const { name, type } = req.body;
    const { guild_id } = req.params;

    if (type && !validTypes.includes(type)) throw new HTTPError("Invalid channel type");
    if (!guild_id || !name) throw new HTTPError("Invalid params");

    const rvId = await fromSnowflake(guild_id);

    const rvChannel = await res.rvAPI.post(`/servers/${rvId}/channels`, {
      name,
      type: type ? await ChannelCreateType.to_quark(type) : "Text",
    }) as API.Channel;

    res.status(201).json(await Channel.from_quark(rvChannel));
  },
};
