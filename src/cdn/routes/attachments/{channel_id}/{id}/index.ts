/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { downloadImage, handleImgRequest } from "../../../../util";

export default (express: Application) => <Resource> {
  get: (req, res) => handleImgRequest(req, res, "attachments"),
};
