/* eslint-disable camelcase */
import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { HTTPError } from "../../../../common/utils";
import { fetchUser } from ".";
import { UserProfile } from "../../../../common/models";
import { fromSnowflake } from "../../../../common/models/util";

export async function getProfile(api: API.API, id: string) {
  // why cant it just be /users/@me/profile ???
  if (id === "@me") {
    const accountInfo = await api.get("/auth/account/");
    const rvProfile = await api.get(`/users/${accountInfo._id}/profile`) as API.UserProfile;

    return rvProfile;
  }

  const rvProfile = await api.get(`/users/${id}/profile`) as API.UserProfile;

  return rvProfile;
}

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const { guild_id, with_mutuals } = req.query;
    const { id } = req.params;

    if (!id) throw new HTTPError("Invalid params");

    const rvId = id !== "@me" ? await fromSnowflake(id) : id;

    const api = res.rvAPI;

    const user = await fetchUser(api, rvId);
    const rvProfile = await getProfile(api, rvId);
    if (!rvProfile || !user) throw new HTTPError("User not found", 422);

    res.json({
      connected_accounts: [],
      user,
      user_profile: await UserProfile.from_quark(rvProfile),
    });
  },

  patch: async (req, res) => {
    const { bio, banner } = req.body;

    await res.rvAPI.patch("/users/@me", {
      profile: {
        content: bio ?? null,
      },
    });

    res.json({
      accent_color: null,
      bio: bio ?? null,
      banner: banner ?? null,
    });
  },
};
