import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "../../../common/utils";

export default (express: Application) => <Resource> {
  get: (req, res) => {
    res.json([]);
  },
  post: (req, res) => {
    throw new HTTPError("unimplemented");
  },
};
