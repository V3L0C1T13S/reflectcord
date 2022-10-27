/* eslint-disable camelcase */
import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { HTTPError } from "../../../common/utils";
import { APILoginResponse, DataLogin, ResponseLogin } from "../../../common/models";

export async function loginToRevolt(api: API.API, req: Request) {
  const loginResponse = await api.post(
    "/auth/session/login",
    await DataLogin.to_quark(req.body),
  );

  return loginResponse;
}

export default (express: Application) => <Resource> {
  post: async (req, res: Response<APILoginResponse>) => {
    const api = res.rvAPI;

    const loginResponse = await loginToRevolt(api, req).catch(() => {
      throw new HTTPError("Revolt failed to login/invalid credentials", 500);
    });

    return res.json(await ResponseLogin.from_quark(loginResponse));
  },
};
