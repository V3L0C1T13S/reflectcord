import { APIEmoji, APIGuildMember, APIUser } from "discord.js";

export enum ProfileThemesExperimentBucket {
  Disabled = 0,
  ViewAndEdit = 1,
  ViewOnly = 2,
  ViewOnlyEditLater = 3,
  ViewAndEditWithTryItOut = 4,
  ViewAndEditWithoutTryItOut = 5,
  Everything = 100,
}

export interface APIUserProfileMetadata {
  bio?: string,
  accent_color?: number | null,
  banner?: string | null,
  pronouns: string,
  guild_id?: string,
  theme_colors?: [number, number],
  popout_animation_particle_type?: string,
  emoji?: APIEmoji | null,
}

export interface APIUserProfile {
  user: APIUser,
  user_profile: APIUserProfileMetadata,
  badges: any[],
  guild_member?: APIGuildMember,
  guild_member_profile?: APIUserProfileMetadata,
  guild_badges: any[],
  legacy_username?: string | null,
  mutual_guilds?: {
    id: string,
    nick: string | null,
  }[],
  mutual_friends_count?: number,
  connected_accounts: any[],
  application_role_connections?: any[],
  premium_type: number | null,
  premium_since: string | null,
  premium_guild_since: string | null,
  profile_themes_experiment_bucket: number,
}
