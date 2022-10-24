/* eslint-disable camelcase */
import axios from "axios";
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { handleImgRequest } from "../../../../util";

export default (express: Application) => <Resource> {
  get: (req, res) => handleImgRequest(req, res, "banners", req.params.splashId),
};
