/* eslint-disable no-bitwise */
/* eslint-disable camelcase */
import {
  AccountInfo,
  Message,
  RelationshipStatus,
  User as RevoltUser,
  UserProfile as RevoltUserProfile,
} from "revolt-api";
import {
  ActivitiesOptions,
  ActivityType,
  APIUser,
  GatewayPresenceUpdateDispatchData,
  PresenceData, UserFlags,
  UserFlagsBitField,
  UserPremiumType,
} from "discord.js";
import Long from "long";
import { Badges } from "../../rvapi";
import { UserRelationshipType } from "../../sparkle";
import { QuarkConversion } from "../QuarkConversion";
import { fromSnowflake, toSnowflake } from "../util";
import { priviligedUsers } from "../../constants/admin";
import { genAnalyticsToken } from "../../utils/discord";
import { Omit } from "../../utils";
import { PartialFile } from "./attachment";
import { RelationshipType } from "./relationship";

export type APIUserProfile = {
  bio: string | null,
  accent_color: any | null,
  banner: string | null,
}

export type MFAInfo = {
  email_otp: boolean;
  trusted_handover: boolean;
  email_mfa: boolean;
  totp_mfa: boolean;
  security_key_mfa: boolean;
  recovery_active: boolean
}

export type revoltUserInfo = {
  user: RevoltUser,
  authInfo: AccountInfo;
  mfaInfo?: MFAInfo | null;
}

export const PublicFlags: QuarkConversion<
  Badges,
  UserFlags,
  { id?: string },
  { id?: string }
> = {
  async to_quark(flags, extra) {
    const discordBitfield = new UserFlagsBitField(flags);
    let calculated = Long.fromNumber(0);

    if (discordBitfield.has("Staff") || (extra?.id && priviligedUsers.includes(extra.id))) calculated = calculated.or(Badges.Developer);
    if (discordBitfield.has("BugHunterLevel1") || discordBitfield.has("BugHunterLevel2")) calculated = calculated.or(Badges.ResponsibleDisclosure);
    if (discordBitfield.has("PremiumEarlySupporter")) calculated.or(Badges.Supporter);
    if (discordBitfield.has("CertifiedModerator")) calculated.or(Badges.PlatformModeration);

    return calculated.toNumber();
  },

  async from_quark(flags, extra) {
    const bf = new UserFlagsBitField();

    if (
      flags & Badges.Developer
      || (extra?.id && priviligedUsers.includes(extra.id))
    ) bf.add("Staff");
    if (flags & Badges.ResponsibleDisclosure) bf.add("BugHunterLevel2");
    if (flags & Badges.Supporter) bf.add("PremiumEarlySupporter");
    if (flags & Badges.PlatformModeration) bf.add("CertifiedModerator");

    return bf.bitfield;
  },
};

export type UserATQ = {};

export type UserAFQ = {
  masquerade: Message["masquerade"],
};

export const User: QuarkConversion<RevoltUser, APIUser, UserATQ, UserAFQ> = {
  async to_quark(user) {
    const { bot, id, username } = user;

    const _id = await fromSnowflake(id);

    return {
      _id,
      username,
      relations: null,
      badges: null,
      status: null,
      profile: {
        background: user.banner ? await PartialFile.to_quark(user.banner) : null,
      }, // FIXME
      flags: null,
      privileged: false,
      bot: bot ? {
        owner: "0",
      } : null,
      relationship: null,
      online: null,
    };
  },

  async from_quark(user, extra) {
    const { _id, username } = user;
    const flags = await PublicFlags.from_quark(user.badges ?? 0, {
      id: _id,
    });

    return {
      id: await toSnowflake(_id),
      accent_color: null,
      avatar: user.avatar
        ? await PartialFile.from_quark(user.avatar, { skipConversion: true })
        : null,
      avatar_decoration: null,
      bot: !!user.bot,
      banner: user.profile?.background
        ? await PartialFile.from_quark(user.profile.background)
        : null,
      banner_color: null,
      discriminator: "0001",
      display_name: null,
      flags,
      username: extra?.masquerade?.name ?? username,
      public_flags: flags,
      verified: true, // all accounts on revolt are implicitly verified
      premium_type: UserPremiumType.Nitro, // unlocks all nitro features,
    };
  },
};

export const UserProfile: QuarkConversion<RevoltUserProfile, APIUserProfile> = {
  async to_quark(profile) {
    const { bio, banner } = profile;

    return {
      content: bio,
      background: banner ? {
        _id: banner,
        tag: "avatars",
        filename: "banner.jpg",
        metadata: {
          type: "Image",
          width: 0,
          height: 0,
        },
        content_type: "attachment",
        size: 0,
      } : null,
    };
  },

  async from_quark(profile) {
    return {
      bio: profile.content ?? null,
      accent_color: null,
      banner: profile.background ? await PartialFile.from_quark(profile.background) : null,
    };
  },
};

export type selfUserATQ = {};

export type selfUserAFQ = Partial<{
  genAnalyticsToken: boolean,
}>;

/**
 * Same as normal user, but includes additional info such as email.
 */
export const selfUser: QuarkConversion<revoltUserInfo, APIUser, selfUserATQ, selfUserAFQ> = {
  async to_quark(user) {
    const mfa_enabled = user.mfa_enabled ?? false;
    return {
      user: await User.to_quark(user),
      authInfo: {
        email: user.email ?? "fixme",
        _id: await fromSnowflake(user.id),
      },
      mfaInfo: {
        email_mfa: mfa_enabled,
        email_otp: mfa_enabled,
        trusted_handover: mfa_enabled,
        totp_mfa: mfa_enabled,
        security_key_mfa: mfa_enabled,
        recovery_active: mfa_enabled,
      },
    };
  },

  async from_quark(user, extra) {
    const mfa_enabled = Object.values(user.mfaInfo ?? []).some((v) => v === true);

    const discordUser = await User.from_quark(user.user);

    return {
      ...discordUser,
      email: user.authInfo.email,
      mfa_enabled,
      // Revolt doesn't require age verification
      nsfw_allowed: true,
      // This doesn't seem to be required but it exists in actual discord so
      premium: true,
      premium_usage_flags: 2,
      purchased_flags: 5,
      locale: "en-US",
      analytics_token: extra?.genAnalyticsToken ? genAnalyticsToken(discordUser.id) : null,
      verified: true,
    };
  },
};

export interface activityTimestamp {
  start?: string,
}

export interface activityAssets {
  large_text?: string,
  small_text?: string,
}

export interface activityMetadata {
  button_urls?: string[],
}

export interface internalActivity extends Omit<ActivitiesOptions, "type"> {
  created_at?: number,
  state?: string,
  details?: string,
  type?: ActivityType,
  timestamps?: activityTimestamp,
  assets?: activityAssets,
  buttons?: string[],
  metadata?: activityMetadata,
}

export interface internalStatus extends Omit<PresenceData, "activities"> {
  activities?: internalActivity[],
  since?: number,
}

export type StatusATQ = {};

export type StatusAFQ = Partial<{
  online: boolean | null | undefined,
}>;

export const Status: QuarkConversion<RevoltUser["status"], internalStatus, StatusATQ, StatusAFQ> = {
  async to_quark(status) {
    const activity = status.activities?.[0];
    const text = (() => {
      switch (activity?.type) {
        case ActivityType.Playing: {
          return `Playing ${activity.name}`;
        }
        case ActivityType.Listening: {
          return `Listening to ${activity.name}`;
        }
        case ActivityType.Streaming: {
          return `Streaming ${activity.name}`;
        }
        case ActivityType.Watching: {
          return `Watching ${activity.name}`;
        }
        case ActivityType.Competing: {
          return `Competing in ${activity.name}`;
        }
        case ActivityType.Custom: {
          return `${activity.state}`;
        }
        default: {
          return null;
        }
      }
    })();

    return {
      presence: (() => {
        switch (status.status) {
          case "online": {
            return "Online";
          }
          case "idle": {
            return "Idle";
          }
          case "dnd": {
            return "Busy";
          }
          case "invisible": {
            return "Invisible";
          }
          default: {
            return null;
          }
        }
      })(),
      text,
    };
  },

  async from_quark(status, extra) {
    const discordStatus: internalStatus = {
      status: (() => {
        if (extra?.online !== null && extra?.online !== undefined && !extra?.online) return "invisible";

        switch (status?.presence) {
          case "Online": {
            return "online";
          }
          case "Idle": {
            return "idle";
          }
          case "Busy": {
            return "dnd";
          }
          case "Invisible": {
            return "invisible";
          }
          case "Focus": {
            return "dnd";
          }
          default: {
            // User hasn't changed status - defaults to online
            return "online";
          }
        }
      })(),
      activities: [],
    };

    if (status?.text) {
      discordStatus.activities?.push({
        created_at: 0,
        id: "custom",
        name: "Custom Status",
        state: status.text,
        type: ActivityType.Custom as any,
      } as any);
    }

    if (discordStatus.status === "idle") {
      discordStatus.since = Date.now();
      discordStatus.afk = true;
    }

    return discordStatus;
  },
};

export type GatewayFullUserPresence = Omit<
  GatewayPresenceUpdateDispatchData, "guild_id" | "user"
> & {
  guild_id?: string;
  last_modified?: number;
  since?: number;
  afk?: boolean;
  user_id?: string;
  user?: GatewayPresenceUpdateDispatchData["user"],
};

export interface RevoltPresenceData {
  user: RevoltUser,
  discordUser?: APIUser,
  server?: string,
  guild_id?: string,
  deduplicate?: boolean,
}

export async function createUserPresence(
  data: RevoltPresenceData,
) {
  const status = await Status.from_quark(data.user.status, {
    online: data.user.online,
  });

  const realStatus = status.status === "invisible" ? "offline" : status.status ?? "offline";
  const user = data.discordUser ?? await User.from_quark(data.user);
  const presence: GatewayFullUserPresence = {
    activities: status.activities as any ?? [],
    client_status: {
      web: realStatus as any,
    },
    status: realStatus as any,
    last_modified: Date.now(),
    user_id: user.id,
  };

  if (data.deduplicate) presence.user_id = user.id;
  else presence.user = user;

  if (status.status === "idle" && status.since && status.afk) {
    presence.since = status.since;
    presence.afk = status.afk;
  }

  if (data.guild_id) presence.guild_id = data.guild_id;
  if (data.server && !data.guild_id) presence.guild_id = await toSnowflake(data.server);

  return presence;
}
