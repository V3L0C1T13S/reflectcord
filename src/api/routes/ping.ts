import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "../../common/utils";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    throw new HTTPError("test", 500);
  },
};
