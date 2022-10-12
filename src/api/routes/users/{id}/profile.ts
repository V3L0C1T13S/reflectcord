/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { UserProfile } from "../../../../common/models";
import { createAPI } from "../../../../common/rvapi";

async function getProfile(api: API.API, id: string) {
  // why cant it just be /users/@me/profile ???
  if (id === "@me") {
    const rvUser = await api.get(`/users/${id}`);
    const rvProfile = await api.get(`/users/${rvUser._id}/profile`) as API.UserProfile;

    return rvProfile;
  }

  const rvProfile = await api.get(`/users/${id}/profile`) as API.UserProfile;

  return rvProfile;
}

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const { guild_id, with_mutuals } = req.query;
    const { id } = req.params;

    if (!id) return res.sendStatus(504);

    const api = createAPI(req.token);

    const rvProfile = await getProfile(api, id);
    if (!rvProfile) return res.sendStatus(500);

    return res.json(await UserProfile.from_quark(rvProfile));
  },
};
