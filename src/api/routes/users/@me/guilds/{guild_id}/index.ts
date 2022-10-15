/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";

export default (express: Application) => <Resource> {
  delete: (req, res) => {
    // Discord client always tries to make us leave. Dont implement.
    res.sendStatus(500);
  },
};
