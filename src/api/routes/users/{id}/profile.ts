/* eslint-disable camelcase */
import { Application, Request } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { decodeTime } from "ulid";
import { HTTPError } from "@reflectcord/common/utils";
import {
  UserProfile, fromSnowflake, toSnowflake,
} from "@reflectcord/common/models";
import { uploadBase64File } from "@reflectcord/cdn/util";
import { PatchCurrentUserBody, ProfileThemesExperimentBucket } from "@reflectcord/common/sparkle";
import { UserPremiumType } from "discord.js";
import { fetchUser } from ".";
import { enableProfileThemes } from "../../../../common/constants/features";

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

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const { guild_id, with_mutuals, with_mutual_guilds } = req.query;
    const { id } = req.params;

    if (!id) throw new HTTPError("Invalid params");

    const rvId = id !== "@me" ? await fromSnowflake(id) : await res.rvAPIWrapper.users.getSelfId();

    const api = res.rvAPI;

    const mutual_guilds: any[] = [];

    const user = await fetchUser(api, rvId);
    const rvProfile = await getProfile(api, rvId);
    if (!rvProfile || !user) throw new HTTPError("User not found", 422);

    if (with_mutual_guilds === "true") {
      const mutuals = await api.get(`/users/${rvId as ""}/mutual`);

      await Promise.all(mutuals.servers.map(async (x) => {
        mutual_guilds.push({
          id: await toSnowflake(x),
          nick: null,
        });
      }));
    }

    res.json({
      connected_accounts: [],
      user,
      user_profile: await UserProfile.from_quark(rvProfile),
      premium_since: new Date(decodeTime(rvId)).toISOString(),
      premium_type: UserPremiumType.Nitro,
      mutual_guilds,
      profile_themes_experiment_bucket: enableProfileThemes
        ? ProfileThemesExperimentBucket.ViewAndEditWithTryItOut
        : ProfileThemesExperimentBucket.Disabled,
    });
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
      avatar: updatedSelf?.avatar?._id ?? null,
      bio: fullUpdatedSelf?.content ?? null,
      banner: fullUpdatedSelf?.background?._id,
    });
  },
};
