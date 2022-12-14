/* eslint-disable camelcase */
import { Response } from "express";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { DiscoveryRequirements, stubDiscoveryRequirements } from "@reflectcord/common/sparkle";

export default () => <Resource> {
  get: (req, res: Response<DiscoveryRequirements>) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    res.json({
      ...stubDiscoveryRequirements,
      guild_id,
    });
  },
};
