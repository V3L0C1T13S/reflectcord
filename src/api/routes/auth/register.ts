/* eslint-disable camelcase */
import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { ResponseLogin } from "@reflectcord/common/models";
import { RegisterSchema } from "@reflectcord/common/sparkle";
import { FieldErrors } from "@reflectcord/common/utils";
import { loginToRevolt } from "./login";

export default (express: Application) => <Resource> {
  post: async (req: Request<{}, {}, RegisterSchema>, res) => {
    const api = res.rvAPI;

    const { body } = req;

    if (!body.email) {
      throw FieldErrors({
        email: { code: "BASE_TYPE_REQUIRED", message: "This field is required" },
      });
    }

    if (!body.password) {
      throw FieldErrors({
        password: { code: "BASE_TYPE_REQUIRED", message: "This field is required" },
      });
    }

    const revoltResponse = await api.post("/auth/account/create", {
      email: body.email,
      password: body.password,
    }).catch(() => {
      res.status(500).json({
        code: 500,
        message: "Failed to create revolt account",
      });
    });
    if (!revoltResponse) return;

    const loginRes = await loginToRevolt(api, {
      login: body.email,
      password: body.password,
    });

    res.json(await ResponseLogin.from_quark(loginRes));
  },
};
