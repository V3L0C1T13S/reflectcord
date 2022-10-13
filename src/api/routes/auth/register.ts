/* eslint-disable camelcase */
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { createAPI } from "../../../common/rvapi";
import { ResponseLogin } from "../../../common/models";
import { loginToRevolt } from "./login";

export default (express: Application) => <Resource> {
  post: async (req, res) => {
    const api = createAPI();

    console.log(JSON.stringify(req.body));

    const revoltResponse = await api.post("/auth/account/create", {
      email: req.body.email,
      password: req.body.password,
    }).catch(() => {
      res.status(500).json({
        code: 500,
        message: "Failed to create revolt account",
      });
    });
    if (!revoltResponse) return;

    const loginRes = await loginToRevolt(api, req);

    res.json(await ResponseLogin.from_quark(loginRes));
  },
};
