/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Message } from "@reflectcord/common/models";

type mentionTuple = {
  messages: API.Message[],
  channelId: string,
}

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const unreads = await res.rvAPI.get("/sync/unreads");

    const rvMessages: API.Message[] = [];

    await Promise.all(unreads.map(async (unread) => {
      if (!unread.mentions) return;

      await Promise.all(unread.mentions.map(async (mention) => {
        const message = await res.rvAPI.get(`/channels/${unread._id.channel as ""}/messages/${mention as ""}`)
          .catch(() => {});
        if (!message) return;

        rvMessages.push(message);
      }));
    }));

    res.json(await Promise.all(rvMessages.map((m) => Message.from_quark(m))));
  },
};
