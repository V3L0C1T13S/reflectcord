/* eslint-disable no-bitwise */
/* eslint-disable camelcase */
import {
  AccountInfo, Message, RelationshipStatus, User as RevoltUser, UserProfile as RevoltUserProfile,
} from "revolt-api";
import {
  ActivitiesOptions,
  ActivityType,
  APIUser,
  PresenceData, UserFlags,
  UserFlagsBitField,
  UserPremiumType,
} from "discord.js";
import { Badges } from "../../rvapi";
import { UserRelationshipType } from "../../sparkle";
import { QuarkConversion } from "../QuarkConversion";
import { toSnowflake } from "../util";
import { priviligedUsers } from "../../constants/admin";

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
  {},
  { id: string }
> = {
  async to_quark(flags) {
    return 0;
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

    return {
      _id: id,
      username,
      relations: null,
      badges: null,
      status: null,
      profile: null, // FIXME
      flags: null,
      privileged: false,
      bot: bot ? {
        owner: "0",
      } : null,
      relationship: null,
      online: null,
    };
  },

  async from_quark(user) {
    const flags = await PublicFlags.from_quark(user.badges ?? 0, {
      id: user._id,
    });

    return {
      id: await toSnowflake(user._id),
      accent_color: null,
      avatar: user.avatar?._id ?? null,
      bot: !!user.bot,
      banner: user.profile?.background?._id ?? null,
      discriminator: "1",
      flags,
      locale: "en-US",
      username: user.username,
      public_flags: flags,
      verified: true, // all accounts on revolt are implicitly verified
      premium_type: UserPremiumType.Nitro, // unlocks all nitro features
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
      banner: profile.background?._id ?? null,
    };
  },
};

/**
 * Same as normal user, but includes additional info such as email.
 */
export const selfUser: QuarkConversion<revoltUserInfo, APIUser> = {
  async to_quark(user) {
    const mfa_enabled = user.mfa_enabled ?? false;
    return {
      user: await User.to_quark(user),
      authInfo: {
        email: user.email ?? "fixme",
        _id: user.id,
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

  async from_quark(user) {
    const mfa_enabled = Object.values(user.mfaInfo ?? []).some((v) => v === true);

    return {
      ...await User.from_quark(user.user),
      email: user.authInfo.email,
      mfa_enabled,
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

export type internalActivity = ActivitiesOptions & {
  state?: string,
  details?: string,
  // FIXME: i want whatever typescript is taking for it to need me to do this garbage
  type?: ActivityType & {
    Custom: 4,
  },
  timestamps?: activityTimestamp,
  assets?: activityAssets,
  buttons?: string[],
  metadata?: activityMetadata,
}

export type internalStatus = PresenceData & {
  activities?: internalActivity[],
}

export type StatusATQ = {};

export type StatusAFQ = Partial<{
  online: boolean | null | undefined,
}>;

export const Status: QuarkConversion<RevoltUser["status"], internalStatus, StatusATQ, StatusAFQ> = {
  async to_quark(status) {
    const activity = status.activities?.[0] as internalActivity;
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
        if (extra && !extra?.online) return "invisible";

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
        name: status.text,
        type: ActivityType.Custom as any,
      });
    }

    return discordStatus;
  },
};

export const Relationship: QuarkConversion<RelationshipStatus, UserRelationshipType> = {
  async to_quark(type) {
    switch (type) {
      case UserRelationshipType.Blocked: {
        return "Blocked";
      }
      case UserRelationshipType.Friends: {
        return "Friend";
      }
      case UserRelationshipType.Incoming: {
        return "Incoming";
      }
      case UserRelationshipType.Outgoing: {
        return "Outgoing";
      }
      default: {
        return "None";
      }
    }
  },

  async from_quark(type) {
    switch (type) {
      case "Blocked": {
        return UserRelationshipType.Blocked;
      }
      case "BlockedOther": {
        return UserRelationshipType.Blocked;
      }
      case "Friend": {
        return UserRelationshipType.Friends;
      }
      case "Incoming": {
        return UserRelationshipType.Incoming;
      }
      case "Outgoing": {
        return UserRelationshipType.Outgoing;
      }
      default: {
        return UserRelationshipType.Friends;
      }
    }
  },
};
