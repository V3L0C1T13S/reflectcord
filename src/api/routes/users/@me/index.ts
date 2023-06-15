/* eslint-disable camelcase */
import { Request } from "express";
import { Resource } from "express-automatic-routes";
import { PatchCurrentAccountBody } from "@reflectcord/common/sparkle";
import { HTTPError } from "@reflectcord/common/utils";
import { User, UserPatchBody } from "@reflectcord/common/models";
import { handleGetUser } from "../{id}";

export default () => <Resource> {
  get: async (req, res) => {
    await handleGetUser(req, res, "@me");
  },
  patch: async (req: Request<any, any, PatchCurrentAccountBody>, res) => {
    const {
      username, password, new_password,
    } = req.body;

    const user = await res.rvAPIWrapper.users.getSelf(true);

    const userPatchBody = await UserPatchBody.to_quark(req.body);

    if (username) {
      if (!password) throw new HTTPError("Password is required", 401);
      await res.rvAPI.patch("/users/@me/username", {
        username,
        password,
      });

      user.username = username;
    }

    if (new_password) {
      if (!password) throw new HTTPError("Password is required", 401);
      await res.rvAPI.patch("/auth/account/change/password", {
        password: new_password,
        current_password: password,
      });
    }

    if (Object.keys(userPatchBody).length > 0) {
      const updatedUser = await res.rvAPI.patch("/users/@me", userPatchBody);

      if (updatedUser.avatar) user.avatar = updatedUser.avatar;
    }

    res.json({
      ...await User.from_quark(user),
      token: req.token,
    });
  },
};
