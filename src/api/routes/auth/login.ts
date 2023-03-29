/* eslint-disable camelcase */
import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { LoginSchema } from "@reflectcord/common/sparkle";
import { APILoginResponse, DataLogin, ResponseLogin } from "@reflectcord/common/models";
import { FieldErrors, HTTPError } from "@reflectcord/common/utils";
import { isAxiosError } from "axios";

export async function loginToRevolt(api: API.API, body: LoginSchema) {
  const loginResponse = await api.post(
    "/auth/session/login",
    await DataLogin.to_quark(body),
  );

  return loginResponse;
}

export default (express: Application) => <Resource> {
  post: async (req: Request<{}, {}, LoginSchema>, res: Response<APILoginResponse>) => {
    const loginResponse = await loginToRevolt(res.rvAPI, req.body).catch((err) => {
      if (isAxiosError(err)) {
        if (!err.response) throw new HTTPError("A bad error response was returned.", 500);
        switch (err.response.data.type) {
          case "InvalidCredentials": {
            throw FieldErrors({
              login: {
                message: "Invalid credentials.",
                code: "INVALID_LOGIN",
              },
            });
          }
          case "LockedOut": {
            throw FieldErrors({
              login: {
                message: "Your account has been temporarily locked out.",
                code: "INVALID_LOGIN",
              },
            });
          }
          default: {
            throw new HTTPError(`Unhandled error type ${err.response?.data.type}! Please report this!`, 500);
          }
        }
      }
      throw new HTTPError("Unknown login error! Please report this!", 500);
    });

    if (loginResponse.result === "Disabled") {
      throw FieldErrors({
        login: {
          message: "Your account has been disabled. Please undisable it on your Revolt instance.",
          code: "INVALID_LOGIN",
        },
      });
    }

    res.json(await ResponseLogin.from_quark(loginResponse));
  },
};
