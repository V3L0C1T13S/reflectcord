import { Application } from "express";
import { Resource } from "express-automatic-routes";

export default (express: Application) => <Resource> {
  get: (req, res) => {
    res.json({ fingerprint: "", assignments: [], guild_experiments: [] });
  },
};
