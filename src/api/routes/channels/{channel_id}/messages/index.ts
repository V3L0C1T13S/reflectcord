/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";

export default (express: Application) => <Resource> {
  post: async (req, res) => {
    const { content } = req.body.payload_json;

    res.sendStatus(204);
  },
};
