/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: async (req, res) => {
    res.json({ country_code: "US" });
  },
};
