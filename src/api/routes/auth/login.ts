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
        if (err.response?.data.type === "InvalidCredentials") {
          throw FieldErrors({
            login: {
              message: "invalidLogin",
              code: "INVALID_LOGIN",
            },
          });
        }
        throw new HTTPError(`Unhandled error type ${err.response?.data.type}! Please report this!`, 500);
      }
      throw new HTTPError("Unknown login error! Please report this!", 500);
    });

    res.json(await ResponseLogin.from_quark(loginResponse));
  },
};
