/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "../../../../common/utils";
import { fromSnowflake } from "../../../../common/models/util";
import { dbEventBus } from "../../../../common/events";

export default (express: Application) => <Resource> {
  post: async (req, res) => {
    const { channel_id } = req.params;
    if (!channel_id) throw new HTTPError("Invalid id");

    const rvId = await fromSnowflake(channel_id);

    dbEventBus.emit("CHANNEL_START_TYPING", rvId, req.token);

    res.sendStatus(204);
  },
};
