/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { handleImgRequest } from "../../../../util";

export default (express: Application) => <Resource> {
  get: (req, res) => handleImgRequest(req, res, "attachments", req.params.id),
};
