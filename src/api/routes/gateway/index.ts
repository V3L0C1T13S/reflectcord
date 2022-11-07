import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { reflectcordWsURL } from "../../../common/constants";

export default (express: Application) => <Resource> {
  get: (req, res) => {
    res.json({
      url: reflectcordWsURL,
    });
  },
};
