/* eslint-disable camelcase */
import { HTTPError } from "@reflectcord/common/utils";
import { DiscoveryMetadataResponse } from "@reflectcord/common/sparkle";
import { Response } from "express";
import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res: Response<DiscoveryMetadataResponse>) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    res.json({
      guild_id,
      primary_category_id: 0,
      keywords: null,
      emoji_discoverability_enabled: true,
      partner_actioned_timestamp: null,
      partner_application_timestamp: null,
      is_published: false,
      reasons_to_join: [],
      social_links: null,
      about: null,
      category_ids: [],
    });
  },
};
