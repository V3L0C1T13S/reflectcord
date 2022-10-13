/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { User } from "../../../../../common/models";
import { createAPI } from "../../../../../common/rvapi";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    res.json({ country_code: "US" });
  },
};
