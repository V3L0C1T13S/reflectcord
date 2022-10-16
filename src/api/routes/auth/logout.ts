/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";

export default (express: Application) => <Resource> {
  post: async (req, res) => {
    const api = res.rvAPI;

    await api.post("/auth/session/logout");

    res.sendStatus(200);
  },
};
