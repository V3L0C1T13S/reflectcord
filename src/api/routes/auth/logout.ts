import { Application } from "express";
import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  post: async (req, res) => {
    await res.rvAPI.post("/auth/session/logout");

    res.sendStatus(204);
  },
};
