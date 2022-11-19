/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { fromSnowflake } from "@reflectcord/common/models";
import { selfEnableServerLeaves } from "@reflectcord/common/constants";
import { HTTPError } from "@reflectcord/common/utils";

export default (express: Application) => <Resource> {
  delete: async (req, res) => {
    const { guildId } = req.params;

    if (!selfEnableServerLeaves || !guildId) throw new HTTPError("Guild not found", 404);

    const rvServerId = await fromSnowflake(guildId);

    await res.rvAPIWrapper.servers.leave(rvServerId);

    res.sendStatus(204);
  },
};
