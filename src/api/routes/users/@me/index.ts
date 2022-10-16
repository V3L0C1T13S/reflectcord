/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { HTTPError } from "../../../../common/utils";
import { selfUser, User } from "../../../../common/models";

export async function getSelfUser(api: API.API) {
  const rvUser = await api.get("/users/@me") as API.User;
  const mfaInfo = !rvUser.bot ? await api.get("/auth/mfa/") : null;
  const authInfo = !rvUser.bot ? await api.get("/auth/account/") : null;

  if (!rvUser) throw new HTTPError("Revolt failed to get info");

  return selfUser.from_quark({
    user: rvUser,
    authInfo: authInfo ?? {
      _id: rvUser._id,
      email: "fixme@gmail.com",
    },
    mfaInfo,
  });
}

export default (express: Application) => <Resource> {
  get: async (req, res) => res.json(await getSelfUser(res.rvAPI)),
  patch: async (req, res) => {
    const {
      username, email, password, new_password,
    } = req.body;

    try {
      const api = res.rvAPI;

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
    } catch (e) {
      return res.sendStatus(500);
    }
  },
};
