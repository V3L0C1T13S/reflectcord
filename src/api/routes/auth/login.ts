/* eslint-disable camelcase */
import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { createAPI } from "../../../common/rvapi";
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
    const api = createAPI(req.token);

    const loginResponse = await loginToRevolt(api, req);

    return res.json(await ResponseLogin.from_quark(loginResponse));
  },
};
