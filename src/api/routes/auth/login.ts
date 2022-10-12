/* eslint-disable camelcase */
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { createAPI } from "../../../common/rvapi";
import { APILoginResponse, DataLogin, ResponseLogin } from "../../../common/models";

export default (express: Application) => <Resource> {
  post: async (req, res: Response<APILoginResponse>) => {
    const api = createAPI(req.token);

    const loginResponse = await api.post(
      "/auth/session/login",
      await DataLogin.to_quark(req.body),
    );

    return res.json(await ResponseLogin.from_quark(loginResponse));
  },
};
