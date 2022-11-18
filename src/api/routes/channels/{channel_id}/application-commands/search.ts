/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";

export default (express: Application) => <Resource> {
  get: (req, res) => {
    res.json({
      applications: [],
      application_commands: [],
      cursor: {
        previous: null,
        next: null,
        repaired: null,
      },
    });
  },
};
