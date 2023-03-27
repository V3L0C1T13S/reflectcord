import {
  APIChannel, APIGuildMember, APIUnavailableGuild, APIUser, GatewayReadyDispatchData,
} from "discord.js";
import {
  UserGuildSetting, UserSettings, ReadStateObject, ConnectedAccount, Session, GatewaySession,
} from "../User";
import { UserRelationshipType } from "../../types";
import { GatewayFullUserPresence, GatewaySessionDTO } from "../../../models";

interface GatewayRelationshipData {
  id: string;
  type: UserRelationshipType;
  nickname: string;
  user: APIUser;
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
  users: APIUser[],
  experiments: number[][],
  private_channels: APIChannel[],
  sessions: GatewaySession[],
  friend_suggestion_count: number,
  guild_join_requests: unknown[],
  connected_accounts: ConnectedAccount[],
  analytics_token: string,
  api_code_version: number, // TODO: Document
  consents: {
    personalization: {
      consented: boolean,
    }
  },
  country_code: string,
  merged_members: APIGuildMember[][],
  indicators_confirmed: unknown,
  notes?: unknown,
  _trace: string[],
  /**
   * Initial presence data for users
  */
  presences: GatewayFullUserPresence[],
  tutorial: {
    indicators_suppressed: boolean,
    indicators_confirmed: string[],
  } | null,
  session_type: "normal",
}
