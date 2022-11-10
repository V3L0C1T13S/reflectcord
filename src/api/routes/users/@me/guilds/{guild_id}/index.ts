/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { fromSnowflake } from "../../../../../../common/models/util";
import { selfEnableServerLeaves } from "../../../../../../common/constants";
import { HTTPError } from "../../../../../../common/utils";

export default (express: Application) => <Resource> {
  delete: async (req, res) => {
    const { guild_id } = req.params;

    if (!selfEnableServerLeaves || !guild_id) throw new HTTPError("Guild not found", 404);

    const rvServerId = await fromSnowflake(guild_id);

    await res.rvAPIWrapper.servers.leave(rvServerId);

    res.sendStatus(204);
  },
};
