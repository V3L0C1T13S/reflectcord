/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { HTTPError } from "../../../../../common/utils";
import { fromSnowflake } from "../../../../../common/models/util";

export default () => <Resource> {
  post: async (req, res) => {
    const { channel_id } = req.params;

    if (!channel_id) throw new HTTPError("Invalid params", 422);

    const { messages } = req.body as { messages: string[] };

    if (!messages) throw new HTTPError("Invalid messages");

    const rvMessages = await Promise.all(messages.map((x) => fromSnowflake(x)));
    const rvId = await fromSnowflake(channel_id);

    await res.rvAPIWrapper.messages.bulkDelete(rvId, rvMessages);
  },
};
