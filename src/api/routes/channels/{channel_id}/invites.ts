/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";

// FIXME
export default (express: Application) => <Resource> {
  post: async (req, res) => {
    res.json([]);
  },
  get: async (req, res) => {
    res.json([]);
  },
};
