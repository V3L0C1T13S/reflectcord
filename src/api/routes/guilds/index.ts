import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { ChannelCreateBody } from "@reflectcord/common/models";
import { Request } from "express";
import { RESTPostAPIGuildsJSONBody } from "discord.js";

export default () => <Resource> {
  post: async (req: Request<{}, {}, RESTPostAPIGuildsJSONBody>, res) => {
    const { name, channels } = req.body;

    if (!name) throw new HTTPError("Guild must be named", 422);

    const server = await res.rvAPIWrapper.servers.createServer({
      name,
      channels: channels ? await Promise.all(channels
        .map((x) => ChannelCreateBody.to_quark(x))) : null,
    });

    res.json(server.discord);
  },
};
