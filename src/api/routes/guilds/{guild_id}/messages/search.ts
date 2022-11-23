/* eslint-disable camelcase */
import { Request } from "express";
import { Resource } from "express-automatic-routes";
import { Message, User, fromSnowflake } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

function convertSortOrder(by: string, order?: string) {
  if (by === "timestamp") {
    switch (order) {
      case "desc": {
        return "Latest";
      }
      case "asc": {
        return "Oldest";
      }
      default: {
        return "Relevance";
      }
    }
  }

  return "Relevance";
}

export default () => <Resource> {
  get: async (
    req: Request<
    any, any, any, {
      content: string,
      channel_id?: string,
      offset: string,
      sort_by: string,
      sort_order?: string,
    }
    >,
    res,
  ) => {
    const {
      content, channel_id, offset, sort_by, sort_order,
    } = req.query;

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

    const rvSearchResults = await res.rvAPI.post(`/channels/${rvChannelId as ""}/search`, {
      query: content,
      include_users: true,
      limit: 100,
      sort: convertSortOrder(sort_by, sort_order),
    });
    if (!("users" in rvSearchResults)) throw new HTTPError("Invalid search res", 500);

    const totalCount = rvSearchResults.messages.length;
    if (offset) {
      rvSearchResults.messages.splice(totalCount - parseInt(offset, 10));
    }

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
      total_results: totalCount,
    });
  },
};
