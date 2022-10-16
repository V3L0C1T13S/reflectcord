/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Message } from "../../../../../../common/models";

export default (express: Application) => <Resource> {
  delete: (req, res) => {
    res.sendStatus(200);
  },
};
