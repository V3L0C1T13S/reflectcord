/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { createAPI } from "../../../common/rvapi";

export default (express: Application) => <Resource> {
  post: async (req, res) => {
    const api = createAPI(req.token);

    const logoutResult = await api.post("/auth/session/logout");

    res.sendStatus(200);
  },
};
