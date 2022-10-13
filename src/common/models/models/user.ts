import { User as RevoltUser, UserProfile as RevoltUserProfile } from "revolt-api";
import { APIUser } from "discord.js";
import { QuarkConversion } from "../QuarkConversion";

export type APIUserProfile = {
  bio: string | null,
  accent_color: any | null,
  banner: string | null,
}

export const User: QuarkConversion<RevoltUser, APIUser> = {
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
    return {
      accent_color: null,
      avatar: user.avatar?._id ?? null,
      bot: !!user.bot,
      banner: user.profile?.background?._id ?? null,
      discriminator: "1",
      email: null,
      flags: 0,
      id: user._id,
      locale: "en-US",
      mfa_enabled: false,
      username: user.username,
      premium_type: 0,
      public_flags: 0,
      system: false,
      verified: false,
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
