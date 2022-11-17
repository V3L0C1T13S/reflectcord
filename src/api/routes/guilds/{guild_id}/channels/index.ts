/* eslint-disable camelcase */
import { Request } from "express";
import { Resource } from "express-automatic-routes";
import { ChannelType as discordChannelType, RESTPostAPIGuildChannelJSONBody } from "discord.js";
import { HTTPError } from "../../../../../common/utils";
import { fromSnowflake } from "../../../../../common/models/util";
import { Channel } from "../../../../../common/models";
import { ChannelCreateBody } from "../../../../../common/models/models/channel";

const validTypes = [discordChannelType.GuildText, discordChannelType.GuildVoice];

export default () => <Resource> {
  // FIXME: missing category support
  post: async (req: Request<any, any, RESTPostAPIGuildChannelJSONBody>, res) => {
    const { body } = req;
    const {
      name, type, nsfw,
    } = body;
    const { guild_id } = req.params;

    if (type && !validTypes.includes(type)) throw new HTTPError("Invalid channel type");
    if (!guild_id || !name) throw new HTTPError("Invalid params");

    const rvId = await fromSnowflake(guild_id);

    const rvChannel = await res.rvAPI.post(`/servers/${rvId as ""}/channels`, await ChannelCreateBody.to_quark(body));

    res.status(201).json(await Channel.from_quark(rvChannel));
  },
};
