/* eslint-disable camelcase */
import { APIEmbed } from "discord.js";
import { Application, Request } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { fromSnowflake } from "../../../../../common/models/util";
import { Message, SendableEmbed } from "../../../../../common/models";
import { HTTPError } from "../../../../../common/utils";

type discordMessageSend = {
  content?: string,
  embeds?: APIEmbed[],
};

export default (express: Application) => <Resource> {
  get: async (req: Request<any, any, any, { limit: string }>, res) => {
    const limit = parseInt(req.query.limit ?? "50", 10);
    const { channel_id } = req.params;

    const rvId = await fromSnowflake(channel_id);

    const msgs = await res.rvAPI.get(`/channels/${rvId}/messages`, {
      limit,
    }) as API.Message[];
    if (!msgs) return;

    return res.json(await Promise.all(msgs.map((m) => Message.from_quark(m))));
  },
  post: async (req: Request<any, any, discordMessageSend>, res) => {
    const { channel_id } = req.params;
    const { content, embeds } = req.body;

    const rvId = await fromSnowflake(channel_id);

    const revoltResponse = await res.rvAPI.post(`/channels/${rvId}/messages`, {
      content: content ?? " ",
      embeds: embeds ? await Promise.all(embeds.map((x) => SendableEmbed.to_quark(x))) : null,
    }) as API.Message;
    if (!revoltResponse) return;

    return res.json(await Message.from_quark(revoltResponse));
  },
};
