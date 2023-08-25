/* eslint-disable camelcase */
import { Request } from "express";
import { Resource } from "express-automatic-routes";
import API from "revolt-api";
import { decodeTime } from "ulid";
import { HTTPError, toCompatibleISO } from "@reflectcord/common/utils";
import {
  UserProfile,
  fromSnowflake,
  toSnowflake, hashToSnowflake, PartialFile, createBadgeArray, Member,
} from "@reflectcord/common/models";
import { uploadBase64File } from "@reflectcord/cdn/util";
import { PatchCurrentUserBody, ProfileThemesExperimentBucket, APIUserProfile } from "@reflectcord/common/sparkle";
import { UserPremiumType } from "discord.js";
import { enableProfileThemes } from "@reflectcord/common/constants";
import { fetchUser } from ".";

export async function getProfile(api: API.API, id: string) {
  // why cant it just be /users/@me/profile ???
  if (id === "@me") {
    const accountInfo = await api.get("/auth/account/");
    const rvProfile = await api.get(`/users/${accountInfo._id as ""}/profile`);

    return rvProfile;
  }

  const rvProfile = await api.get(`/users/${id as ""}/profile`);

  return rvProfile;
}

export default () => <Resource> {
  get: async (req, res) => {
    const {
      guild_id, with_mutuals, with_mutual_guilds, with_mutual_friends_count,
    } = req.query;
    const { id } = req.params;

    if (!id) throw new HTTPError("Invalid params");
    if (guild_id && typeof guild_id !== "string") throw new HTTPError("bad query");

    const currentId = await res.rvAPIWrapper.users.getSelfId();
    const rvId = id !== "@me" ? await fromSnowflake(id) : currentId;
    const server = guild_id ? await fromSnowflake(guild_id) : null;

    const api = res.rvAPI;

    const mutual_guilds: any[] = [];

    const user = await fetchUser(api, rvId);
    const rvProfile = await getProfile(api, rvId);
    if (!rvProfile || !user) throw new HTTPError("User not found", 404);

    let mutual_friends_count: number | null = null;

    // FIXME: Discord client sometimes does this garbage
    if (with_mutual_guilds === "true" && rvId !== currentId) {
      const mutuals = await api.get(`/users/${rvId as ""}/mutual`);

      mutual_friends_count = mutuals.users.length;

      await Promise.all(mutuals.servers.map(async (x) => {
        mutual_guilds.push({
          id: await toSnowflake(x),
          nick: null,
        });
      }));
    }

    const member = server ? await api.get(`/servers/${server as ""}/members/${rvId as ""}`)
      : null;

    const badges = user.flags ? createBadgeArray(user.flags) : [];
    const discordProfile = await UserProfile.from_quark(rvProfile, {
      guild_id,
    });

    const body: APIUserProfile = {
      connected_accounts: [],
      user,
      user_profile: discordProfile,
      badges,
      premium_since: toCompatibleISO(new Date(decodeTime(rvId)).toISOString()),
      premium_type: UserPremiumType.Nitro,
      premium_guild_since: null,
      profile_themes_experiment_bucket: enableProfileThemes
        ? ProfileThemesExperimentBucket.ViewAndEditWithTryItOut
        : ProfileThemesExperimentBucket.Disabled,
      guild_badges: [],
    };
    if (with_mutuals
      || with_mutual_friends_count) body.mutual_friends_count = mutual_friends_count ?? 0;
    if (with_mutual_guilds) body.mutual_guilds = mutual_guilds ?? [];
    if (member) {
      body.guild_member = await Member.from_quark(member);
      body.guild_member_profile = discordProfile;
    }

    res.json(body);
  },
  patch: async (
    req: Request<any, any, PatchCurrentUserBody>,
    res,
  ) => {
    const {
      username, avatar, bio, banner,
    } = req.body;

    const avatarId = avatar && avatar.startsWith("data:") ? await uploadBase64File("avatars", {
      name: "avatar.png",
      file: avatar,
    }) : null;

    const bannerId = banner && banner.startsWith("data:") ? await uploadBase64File("backgrounds", {
      name: "banner.png",
      file: banner,
    }) : null;

    const updatedSelf = await res.rvAPI.patch("/users/@me", {
      avatar: avatarId,
      profile: {
        content: bio ?? null,
        background: bannerId,
      },
    });

    const fullUpdatedSelf = await getProfile(res.rvAPI, "@me");

    res.json({
      accent_color: null,
      avatar: updatedSelf?.avatar
        ? await PartialFile.from_quark(updatedSelf.avatar, { skipConversion: true })
        : null,
      bio: fullUpdatedSelf?.content ?? null,
      banner: fullUpdatedSelf?.background
        ? await hashToSnowflake(fullUpdatedSelf.background._id) : null,
    });
  },
};
