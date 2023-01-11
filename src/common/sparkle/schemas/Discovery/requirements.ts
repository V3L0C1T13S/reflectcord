export interface DiscoveryNsfw_property {}

export interface DiscoveryHealth_score {
  avg_nonnew_participators?: any;
  avg_nonnew_communicators?: any;
  num_intentful_joiners?: any;
  perc_ret_w1_intentful?: any;
}

export interface DiscoveryRequirements {
  guild_id: string;
  safe_environment: boolean;
  healthy: boolean;
  health_score_pending: boolean;
  size: boolean;
  nsfw_properties: DiscoveryNsfw_property;
  protected: boolean;
  sufficient: boolean;
  sufficient_without_grace_period: boolean;
  valid_rules_channel: boolean;
  retention_healthy: boolean;
  engagement_healthy: boolean;
  age: boolean;
  minimum_age: number;
  health_score: DiscoveryHealth_score;
  minimum_size: number;
}

export const stubDiscoveryRequirements = {
  guild_id: "0",
  safe_environment: true,
  healthy: true,
  health_score_pending: false,
  size: true,
  nsfw_properties: {},
  protected: true,
  sufficient: true,
  sufficient_without_grace_period: true,
  valid_rules_channel: true,
  retention_healthy: true,
  engagement_healthy: true,
  age: true,
  minimum_age: 56,
  health_score: {
    avg_nonnew_participators: 999999,
    avg_nonnew_communicators: 999999,
    num_intentful_joiners: 999999,
    perc_ret_w1_intentful: 999999,
  },
  /**
   * rvlt.gg accepts servers of all sizes. May want to allow this to be adjusted
   * for open discovery
  */
  minimum_size: 0,
};
