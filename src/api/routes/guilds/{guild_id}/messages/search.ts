/* eslint-disable camelcase */
import { Application, Request } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Message, User } from "../../../../../common/models";
import { HTTPError } from "../../../../../common/utils";
import { fromSnowflake } from "../../../../../common/models/util";

export default (express: Application) => <Resource> {
  get: async (req: Request<any, any, any, { content: string, channel_id?: string }>, res) => {
    const { content, channel_id } = req.query;

    if (!content) throw new HTTPError("Invalid search params");

    // FIXME
    if (!channel_id) {
      return res.json({
      // analytics_id: "0",
        messages: [],
        total_results: 0,
      });
    }

    const rvChannelId = await fromSnowflake(channel_id);

    const rvSearchResults = await res.rvAPI.post(`/channels/${rvChannelId}/search`, {
      query: content,
      include_users: true,
    }) as API.BulkMessageResponse;
    if (!("users" in rvSearchResults)) throw new HTTPError("Invalid search res", 500);

    const messages = await Promise.all(rvSearchResults.messages.map(async (x) => {
      const message = await Message.from_quark(x);
      const author = rvSearchResults.users.find((u) => u._id === x.author)!;

      return [{
        ...message,
        author: await User.from_quark(author),
        hit: true,
      }];
    }));

    return res.json({
      analytics_id: "0",
      messages,
      total_results: messages.length,
    });
  },
};
