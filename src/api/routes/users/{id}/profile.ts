/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { HTTPError } from "../../../../common/utils";
import { fetchUser } from ".";
import { UserProfile } from "../../../../common/models";
import { fromSnowflake } from "../../../../common/models/util";

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

    const rvId = await fromSnowflake(id);

    const api = res.rvAPI;

    const user = await fetchUser(api, rvId);
    const rvProfile = await getProfile(api, rvId);
    if (!rvProfile || !user) throw new HTTPError("User not found", 422);

    return res.json({
      connected_accounts: [],
      user,
      user_profile: await UserProfile.from_quark(rvProfile),
    });
  },
};
