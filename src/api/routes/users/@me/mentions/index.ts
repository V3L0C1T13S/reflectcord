/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { APIMessage } from "discord.js";
import { Response } from "express";

export default () => <Resource> {
  get: async (req, res: Response<APIMessage[]>) => {
    const unreads = await res.rvAPIWrapper.messages.fetchUnreads();

    const messages: APIMessage[] = [];

    await Promise.all(unreads.map(async (unread) => {
      if (!unread.mentions) return;

      await Promise.all(unread.mentions.map(async (mention) => {
        const message = await res.rvAPIWrapper.messages.fetch(unread._id.channel, mention)
          .catch(() => null);
        if (!message) return;

        messages.push(message.discord);
      }));
    }));

    res.json(messages);
  },
};
