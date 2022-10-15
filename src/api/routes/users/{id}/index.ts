import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { User } from "../../../../common/models";

export async function fetchUser(api: API.API, id: string) {
  const rvUser = await api.get(`/users/${id}`) as API.User;

  return User.from_quark(rvUser);
}

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const { id } = req.params;

    if (!id) return res.sendStatus(422);

    const rvUser = await fetchUser(res.rvAPI, id).catch(() => {
      res.sendStatus(500);
    });
    if (!rvUser) return;

    return res.json(rvUser);
  },
};
