/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";

// FIXME
export default (express: Application) => <Resource> {
  get: (req, res) => {
    res.sendStatus(500);
  },
};
