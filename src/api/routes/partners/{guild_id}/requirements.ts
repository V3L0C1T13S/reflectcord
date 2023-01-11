/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { stubDiscoveryRequirements } from "@reflectcord/common/sparkle";

export default () => <Resource> {
  get: (req, res) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    res.json({
      ...stubDiscoveryRequirements,
      guild_id,
    });
  },
};
