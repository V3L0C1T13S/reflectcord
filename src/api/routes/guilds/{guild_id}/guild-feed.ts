/* eslint-disable camelcase */
import { Response } from "express";
import { Resource } from "express-automatic-routes";
import { fromSnowflake, Message } from "@reflectcord/common/models";
import { GuildFeedResponse } from "@reflectcord/common/sparkle";
import { HTTPError } from "@reflectcord/common/utils";
import { systemUserID } from "@reflectcord/common/rvapi";

export default () => <Resource> {
  get: async (req, res: Response<GuildFeedResponse>) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    const serverId = await fromSnowflake(guild_id);

    const server = await res.rvAPIWrapper.servers.fetch(serverId);

    // FIXME
    res.json({
      results: {
        items: [{
          id: `message/${systemUserID}`,
          message: await Message.from_quark({
            _id: systemUserID,
            content: `Welcome to ${server.discord.name}! This section isn't implemented yet, but if you'd like to hack something up, feel free to PR it!`,
            author: systemUserID,
            channel: server.revolt.channels[0] ?? systemUserID,
          }),
          reference_messages: [],
          seen: false,
          type: "message",
        }],
      },
    });
  },
};
