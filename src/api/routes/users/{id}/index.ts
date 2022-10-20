import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { HTTPError } from "../../../../common/utils";
import { User } from "../../../../common/models";
import { fromSnowflake } from "../../../../common/models/util";

export async function fetchUser(api: API.API, id: string) {
  const rvUser = await api.get(`/users/${id}`) as API.User;

  return User.from_quark(rvUser);
}

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const { id } = req.params;

    if (!id) throw new HTTPError("ID not supplied", 422);

    const rvId = id !== "@me" ? await fromSnowflake(id) : "@me";

    const rvUser = await fetchUser(res.rvAPI, rvId);
    if (!rvUser) throw new HTTPError("User not found", 500);

    return res.json(rvUser);
  },
};
