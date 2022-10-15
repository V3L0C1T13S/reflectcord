/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { fetchUser } from ".";
import { UserProfile } from "../../../../common/models";

async function getProfile(api: API.API, id: string) {
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

    if (!id) return res.sendStatus(422);

    const api = res.rvAPI;

    const user = await fetchUser(api, id).catch(() => {
      res.sendStatus(500);
    });
    const rvProfile = await getProfile(api, id).catch(() => {
      res.sendStatus(500);
    });
    if (!rvProfile) return;

    return res.json({
      connected_accounts: [],
      user,
      user_profile: await UserProfile.from_quark(rvProfile),
    });
  },
};
