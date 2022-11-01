import { Resource } from "express-automatic-routes";
import { handleImgRequest } from "../../../util";

export default () => <Resource> {
  get: (req, res) => handleImgRequest(req, res, "attachments", req.params.iconId),
};
