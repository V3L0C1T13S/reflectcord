/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { selfUser, User } from "../../../../common/models";
import { createAPI } from "../../../../common/rvapi";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const api = createAPI(req.token);

    const rvUser = await api.get("/users/@me") as API.User;
    const authInfo = await api.get("/auth/account/");

    return res.json(await selfUser.from_quark({
      user: rvUser,
      authInfo,
    }));
  },
  patch: async (req, res) => {
    const {
      username, email, password, new_password,
    } = req.body;

    const api = createAPI(req.token);

    if (username) {
      await api.patch("/users/@me/username", {
        username,
        password,
      });
    }

    if (email) {
      await api.patch("/auth/account/change/email", {
        email,
        current_password: password,
      });
    }

    if (password) {
      await api.patch("/auth/account/change/password", {
        password: new_password,
        current_password: password,
      });
    }

    const rvUser = await api.get("/users/@me") as API.User;
    if (!rvUser) return res.sendStatus(500);

    return res.json({
      ...await User.from_quark(rvUser),
      token: req.token,
    });
  },
};
