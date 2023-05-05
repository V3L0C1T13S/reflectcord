import {
  APIChannel,
  APIUnavailableGuild, APIUser, GatewayReadyDispatchData,
} from "discord.js";
import {
  UserGuildSetting, UserSettings, ReadStateObject, ConnectedAccount, GatewaySession,
} from "../User";
import { UserRelationshipType } from "../../types";
import { GatewayFullUserPresence } from "../../../models";
import { MergedMember } from "./Members";
import { GatewayPrivateChannel } from "./Channel";

export interface CommonGatewayRelationshipData {
  id: string;
  type: UserRelationshipType;
  nickname: string;
}

export interface GatewayRelationshipDataV1 extends CommonGatewayRelationshipData {
  user: APIUser;
}

/**
 * Sent in READY.relationships when the client has the DeduplicateUserObjects
 * capability.
*/
export interface GatewayRelationshipDataDeduplicated extends CommonGatewayRelationshipData {
  user_id: string;
}

export type GatewayRelationshipData =
  Omit<GatewayRelationshipDataDeduplicated, "user_id">
  & Omit<GatewayRelationshipDataV1, "user">
  & {
    user_id?: GatewayRelationshipDataDeduplicated["user_id"],
    user?: GatewayRelationshipDataV1["user"],
  }

export interface MergedPresences {
  /**
   * Presences for everyone in your merged_members array (excluding yourself)
  */
  guilds: GatewayFullUserPresence[][],
  /**
   * Presences for your friends
  */
  friends: GatewayFullUserPresence[],
}

export interface ReadyData extends Omit<GatewayReadyDispatchData, "application"> {
  application?: GatewayReadyDispatchData["application"],
  auth_session_id_hash?: string, // TODO: Document
  guilds: APIUnavailableGuild[] | any,
  /**
   * User settings in plain JSON form. This is only sent for
   * backwards compat purposes.
   */
  user_settings?: UserSettings | null | undefined,
  /**
   * The PRELOADED_USER_SETTINGS protobuf for this user.
  */
  user_settings_proto?: string | null | undefined,
  guild_experiments: unknown[],
  /**
   * An array of RTC Regions that are close to the user.
  */
  geo_ordered_rtc_regions: string[],
  relationships: GatewayRelationshipData[],
  read_state?: {
    entries: ReadStateObject[],
    partial: boolean,
    version: number,
  } | ReadStateObject[],
  user_guild_settings: {
    entries: UserGuildSetting[],
    partial: boolean,
    version: number,
  } | UserGuildSetting[],
  users?: APIUser[],
  experiments: number[][],
  private_channels: APIChannel[] | GatewayPrivateChannel[],
  sessions: GatewaySession[],
  friend_suggestion_count: number,
  guild_join_requests: unknown[],
  connected_accounts: ConnectedAccount[],
  /**
   * Refer to genAnalyticsToken function
  */
  analytics_token: string,
  api_code_version: number, // TODO: Document
  consents: {
    personalization: {
      consented: boolean,
    }
  },
  country_code: string,
  merged_members?: MergedMember[][],
  merged_presences?: MergedPresences,
  indicators_confirmed: unknown,
  notes?: unknown,
  /**
   * Trace information sent by the gateway. Useful for debugging
   * if performance problems are in the client or in your
   * server.
  */
  _trace: string[],
  /**
   * Initial presence data for users
  */
  presences?: GatewayFullUserPresence[],
  tutorial: {
    indicators_suppressed: boolean,
    indicators_confirmed: string[],
  } | null,
  session_type: "normal",
}

export interface ReadySupplementalData {
  merged_presences: MergedPresences,
  /**
   * Member information about people in your users array for mutual
   * servers. This is primarily to populate your direct message headers
   * with the users server profile.
  */
  merged_members: MergedMember[][],
  /**
   * Does anybody know if this is ever populated with anything?
  */
  lazy_private_channels: APIChannel[],
  guilds: {
    /**
     * Voice states for guilds you are in.
    */
    voice_states: any[],
    id: string,
    embedded_activities: unknown[],
  }[],
  disclose: unknown[],
}
