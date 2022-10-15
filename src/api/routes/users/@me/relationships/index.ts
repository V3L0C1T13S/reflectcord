/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { User } from "../../../../../common/models";

export default (express: Application) => <Resource> {
  get: (req, res) => {
    res.json([]);
  },
  post: async (req, res) => {
    const { username } = req.body;
    if (!username) return res.sendStatus(422);

    const rvRes = await res.rvAPI.post("/users/friend", {
      username,
    }).catch(() => {
      res.sendStatus(500);
    });
    if (!rvRes) return;

    return res.json(await User.from_quark(rvRes));
  },
};
