/* eslint-disable camelcase */
import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
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
      res.status(500).json({
        // @ts-ignore
        code: 500,
        message: "Revolt failed to login.",
      });
    });
    if (!loginResponse) return;

    return res.json(await ResponseLogin.from_quark(loginResponse));
  },
};
