/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { FieldError, FieldErrors } from "@reflectcord/common/utils";
import { BaseTypeRequiredError } from "@reflectcord/common/sparkle";
import { getServerConfig } from "@reflectcord/common/constants";

export default () => <Resource> {
  post: async (req, res) => {
    const config = await getServerConfig();
    const { login, captcha_key } = req.body;

    if (!captcha_key && config.features.captcha.enabled) {
      res.status(400);
      return res.json({
        captcha_key: ["captcha-required"],
        captcha_sitekey: config.features.captcha.key,
        captcha_service: "hcaptcha",
      });
    }

    if (!login) {
      throw FieldErrors({
        email: BaseTypeRequiredError,
        login: BaseTypeRequiredError,
      });
    }

    await res.rvAPI.post("/auth/account/reset_password", {
      email: login,
      captcha: captcha_key,
    });

    return res.sendStatus(204);
  },
};
