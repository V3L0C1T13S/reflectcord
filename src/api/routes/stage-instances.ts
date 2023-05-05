import { Application } from "express";
import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    res.json([]);
  },
};
