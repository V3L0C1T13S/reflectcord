import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { User } from "../../../../common/models";
import { createAPI } from "../../../../common/rvapi";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const { id } = req.params;

    if (!id) return res.sendStatus(504);

    const api = createAPI(req.token);

    const rvUser = await api.get(`/users/${id}`) as API.User;

    return res.json(await User.from_quark(rvUser));
  },
};
