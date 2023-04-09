/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { handleFile } from "@reflectcord/cdn/util";
import { Emoji, fromSnowflake } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";
import { APIEmoji } from "discord.js";
import { Response } from "express";

export default () => <Resource> {
  get: async (req, res: Response<APIEmoji[]>) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    const serverId = await fromSnowflake(guild_id);

    const emojis = await res.rvAPI.get(`/servers/${serverId as ""}/emojis`);

    res.json(await Promise.all(emojis.map((x) => Emoji.from_quark(x))));
  },
  post: async (req, res) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    const serverId = await fromSnowflake(guild_id);

    const fileId = await handleFile("emojis", req.body.image);

    const emoji = await res.rvAPI.put(`/custom/emoji/${fileId as ""}`, {
      name: req.body.name ?? "emoji",
      parent: {
        type: "Server",
        id: serverId,
      },
    });

    res.json(await Emoji.from_quark(emoji));
  },
};
