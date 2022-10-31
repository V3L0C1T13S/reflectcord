/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { fromSnowflake } from "../../../../../../common/models/util";
import { HTTPError } from "../../../../../../common/utils";

export default () => <Resource> {
  put: async (req, res) => {
    const { channel_id, userId } = req.params;
    if (!userId || !channel_id) throw new HTTPError("Invalid params");

    const rvUserId = await fromSnowflake(userId);
    const rvChannelId = await fromSnowflake(channel_id);

    await res.rvAPIWrapper.channels.addToGroup(rvChannelId, rvUserId);

    res.sendStatus(204);
  },
  delete: async (req, res) => {
    const { channel_id, userId } = req.params;
    if (!userId || !channel_id) throw new HTTPError("Invalid params");

    const rvUserId = await fromSnowflake(userId);
    const rvChannelId = await fromSnowflake(channel_id);

    await res.rvAPIWrapper.channels.removeFromGroup(rvChannelId, rvUserId);

    res.sendStatus(204);
  },
};
