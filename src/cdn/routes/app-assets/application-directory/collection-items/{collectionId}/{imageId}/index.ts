import { handleImgRequest } from "cdn/util";
import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => handleImgRequest(req, res, "backgrounds", req.params.imageId),
};
