/* eslint-disable camelcase */
import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { HTTPError } from "../../../common/utils";
import { APILoginResponse, DataLogin, ResponseLogin } from "../../../common/models";
import { LoginSchema } from "../../../common/sparkle";

export async function loginToRevolt(api: API.API, body: LoginSchema) {
  const loginResponse = await api.post(
    "/auth/session/login",
    await DataLogin.to_quark(body),
  );

  return loginResponse;
}

export default (express: Application) => <Resource> {
  post: async (req: Request<{}, {}, LoginSchema>, res: Response<APILoginResponse>) => {
    const loginResponse = await loginToRevolt(res.rvAPI, req.body).catch(() => {
      throw new HTTPError("Revolt failed to login/invalid credentials", 500);
    });

    res.json(await ResponseLogin.from_quark(loginResponse));
  },
};
