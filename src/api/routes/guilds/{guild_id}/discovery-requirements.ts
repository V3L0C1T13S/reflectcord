/* eslint-disable camelcase */
import { Response } from "express";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { DiscoveryRequirements } from "@reflectcord/common/sparkle";

export default () => <Resource> {
  get: (req, res: Response<DiscoveryRequirements>) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    res.json({
      guild_id,
      safe_environment: true,
      healthy: false,
      health_score_pending: true,
      size: true,
      nsfw_properties: {},
      protected: false,
      sufficient: false,
      sufficient_without_grace_period: false,
      valid_rules_channel: true,
      retention_healthy: false,
      engagement_healthy: false,
      age: true,
      minimum_age: 56,
      health_score: {
        avg_nonnew_participators:
        null,
        avg_nonnew_communicators: null,
        num_intentful_joiners: null,
        perc_ret_w1_intentful: null,
      },
      /**
       * rvlt.gg accepts servers of all sizes. May want to allow this to be adjusted
       * for open discovery
      */
      minimum_size: 0,
    });
  },
};
