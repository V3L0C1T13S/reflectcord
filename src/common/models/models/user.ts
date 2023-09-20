/* eslint-disable no-bitwise */
/* eslint-disable camelcase */
import {
  AccountInfo,
  DataEditUser,
  FieldsUser,
  Message,
  User as RevoltUser,
  UserProfile as RevoltUserProfile,
} from "revolt-api";
import {
  ActivitiesOptions,
  ActivityType,
  APIEmoji,
  APIPartialEmoji,
  APIUser,
  GatewayPresenceUpdateDispatchData,
  PresenceData, PresenceUpdateStatus, UserFlags,
  UserFlagsBitField,
  UserPremiumType,
} from "discord.js";
import Long from "long";
import { uploadBase64File } from "@reflectcord/cdn/util";
import { Badges } from "../../rvapi";
import { PatchCurrentAccountBody } from "../../sparkle";
import { QuarkConversion } from "../QuarkConversion";
import { fromSnowflake, toSnowflake } from "../util";
import { priviligedUsers } from "../../constants/admin";
import { genAnalyticsToken } from "../../utils/discord";
import { Omit } from "../../utils";
import { PartialFile } from "./attachment";

export type APIUserProfile = {
  bio?: string,
  accent_color?: number | null,
  banner?: string | null,
  pronouns: string,
  guild_id?: string,
  theme_colors?: [number, number],
  popout_animation_particle_type?: string,
  emoji?: APIEmoji | null,
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

const pronounsRegex = /(s|t)?he(y?)\/(t?)h(er|im|em)/gi;

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

interface APIBadge {
  id: string,
  description: string,
  icon: string,
  link?: string,
}

export function createBadgeArray(flags: UserFlags): APIBadge[] {
  const badges: APIBadge[] = [];

  if (flags & UserFlags.Partner) {
    badges.push({
      id: "3",
      description: "Partnered Server Owner",
      icon: "3f9748e53446a137a052f3454e2de41e",
      link: "https://discord.com/partners",
    });
  }
  if (flags & UserFlags.Staff) {
    badges.push({
      id: "2",
      description: "Discord Staff",
      icon: "5e74e9b61934fc1f67c65515d1f7e60d",
    });
  }
  if (flags & UserFlags.CertifiedModerator) {
    badges.push({
      id: "4",
      description: "Moderator Programs Alumni",
      icon: "fee1624003e2fee35cb398e125dc479b",
      link: "https://discord.com/safety",
    });
    badges.push({
      id: "10001",
      description: "Revolt Platform Moderation",
      icon: "",
      link: "https://revolt.chat",
    });
  }

  return badges;
}

export const User: QuarkConversion<RevoltUser, APIUser, UserATQ, UserAFQ> = {
  async to_quark(user) {
    const {
      bot, id, username, discriminator, global_name,
    } = user;

    const _id = await fromSnowflake(id);

    const revoltUser: RevoltUser = {
      _id,
      username,
      discriminator,
      display_name: global_name ?? null,
      relations: null,
      badges: null,
      status: null,
      profile: {
        background: user.banner ? await PartialFile.to_quark(user.banner) : null,
      }, // FIXME
      flags: null,
      privileged: false,
      relationship: null,
      online: null,
    };

    if (bot) {
      revoltUser.bot = {
        owner: "0",
      };
    }

    return revoltUser;
  },

  async from_quark(user, extra) {
    const {
      _id, username, discriminator, display_name,
    } = user;
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
      discriminator,
      display_name,
      global_name: display_name ?? null,
      flags,
      username: extra?.masquerade?.name ?? username,
      public_flags: flags,
      verified: true, // all accounts on revolt are implicitly verified
      premium_type: UserPremiumType.Nitro, // unlocks all nitro features,
    };
  },
};

type UserProfileATQ = {};
type UserProfileAFQ = {
  server?: string | null | undefined,

  guild_id?: string | null | undefined,
};

export const UserProfile: QuarkConversion<
  RevoltUserProfile,
  APIUserProfile,
  UserProfileATQ,
  UserProfileAFQ
> = {
  async to_quark(profile) {
    const { bio, banner } = profile;

    const revoltProfile: RevoltUserProfile = {
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
    if (bio) revoltProfile.content = bio;

    return revoltProfile;
  },

  async from_quark(profile, extra) {
    let guildId: string | null = null;
    if (extra?.guild_id) guildId = extra.guild_id;
    else if (extra?.server) guildId = await toSnowflake(extra.server);

    const pronouns = profile.content?.match(pronounsRegex)?.[0] ?? "";

    const discordProfile: APIUserProfile = {
      accent_color: null,
      banner: profile.background ? await PartialFile.from_quark(profile.background) : null,
      pronouns,
    };
    if (profile.content) discordProfile.bio = profile.content;
    if (guildId) discordProfile.guild_id = guildId;

    return discordProfile;
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

export const UserPatchBody: QuarkConversion<
  DataEditUser,
  PatchCurrentAccountBody
> = {
  async to_quark(data) {
    const { avatar, global_name } = data;
    const body: DataEditUser = {};
    const remove: FieldsUser[] = [];

    if (avatar && avatar.startsWith("data:")) {
      body.avatar = await uploadBase64File("avatars", {
        file: avatar,
      });
    } else if (("avatar" in data) && !avatar) remove.push("Avatar");

    if (global_name) {
      body.display_name = global_name;
    } else if ("global_name" in data && !global_name) remove.push("DisplayName");

    if (remove.length > 0) body.remove = remove;

    return body;
  },

  async from_quark(data) {
    return {};
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
  emoji?: APIPartialEmoji | null,
  created_at?: number,
  state?: string,
  details?: string,
  type?: ActivityType,
  timestamps?: activityTimestamp,
  assets?: activityAssets,
  buttons?: string[],
  metadata?: activityMetadata,
  id?: string,
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
          // FIXME: no custom emoji support
          const emoji = !activity.emoji?.id ? activity.emoji?.name : null;

          return `${emoji ? `${emoji} ` : ""}${activity.state}`;
        }
        default: {
          return null;
        }
      }
    })();

    const revoltStatus: RevoltUser["status"] = {
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

    return revoltStatus;
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
        type: ActivityType.Custom,
      });
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
  minifyUser?: boolean,
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
      web: realStatus as PresenceUpdateStatus,
    },
    status: realStatus as any,
    last_modified: Date.now(),
    user_id: user.id,
  };

  if (data.deduplicate) presence.user_id = user.id;
  else presence.user = data.minifyUser ? { id: user.id } : user;

  if (status.status === "idle" && status.since && status.afk) {
    presence.since = status.since;
    presence.afk = status.afk;
  }

  if (data.guild_id) presence.guild_id = data.guild_id;
  if (data.server && !data.guild_id) presence.guild_id = await toSnowflake(data.server);

  return presence;
}
