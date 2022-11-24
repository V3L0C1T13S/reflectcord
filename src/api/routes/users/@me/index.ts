import { Request } from "express";
import { Resource } from "express-automatic-routes";
import { PatchCurrentAccountBody } from "@reflectcord/common/sparkle";
import { HTTPError } from "@reflectcord/common/utils";
import { User } from "@reflectcord/common/models";
import { handleGetUser } from "../{id}";

export default () => <Resource> {
  get: async (req, res) => {
    await handleGetUser(req, res, "@me");
  },
  patch: async (req: Request<any, any, PatchCurrentAccountBody>, res) => {
    const { avatar, username, password } = req.body;

    const user = await res.rvAPIWrapper.users.getSelf(true);

    if (username) {
      if (!password) throw new HTTPError("Password is required", 401);
      await res.rvAPI.patch("/users/@me/username", {
        username,
        password,
      });

      user.username = username;
    }

    res.json({
      ...await User.from_quark(user),
      token: req.token,
    });
  },
};
