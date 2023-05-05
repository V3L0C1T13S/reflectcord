/* eslint-disable camelcase */
import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { ResponseLogin } from "@reflectcord/common/models";
import { RegisterSchema } from "@reflectcord/common/sparkle";
import { FieldErrors } from "@reflectcord/common/utils";
import { getServerConfig } from "@reflectcord/common/constants";
import { loginToRevolt } from "./login";

export default () => <Resource> {
  post: async (req: Request<{}, {}, RegisterSchema>, res) => {
    const api = res.rvAPI;

    const config = await getServerConfig();

    const {
      email, password, captcha_key, username,
    } = req.body;

    if (!captcha_key && config.features.captcha.enabled) {
      res.status(400);
      return res.json({
        captcha_key: ["captcha-required"],
        captcha_sitekey: config.features.captcha.key,
        captcha_service: "hcaptcha",
      });
    }

    if (!email) {
      throw FieldErrors({
        email: { code: "BASE_TYPE_REQUIRED", message: "This field is required" },
      });
    }

    if (!password) {
      throw FieldErrors({
        password: { code: "BASE_TYPE_REQUIRED", message: "This field is required" },
      });
    }

    await api.post("/auth/account/create", {
      email,
      password,
      captcha: captcha_key ?? null,
    });

    const loginRes = await loginToRevolt(api, {
      login: email,
      password,
    });

    return res.json(await ResponseLogin.from_quark(loginRes));
  },
};
