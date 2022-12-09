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
