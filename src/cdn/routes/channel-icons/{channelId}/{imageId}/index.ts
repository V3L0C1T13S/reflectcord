import { Resource } from "express-automatic-routes";
import { handleImgRequest } from "../../../../util";

export default () => <Resource> {
  get: async (req, res) => {
    await handleImgRequest(req, res, "icons", req.params.imageId);
  },
};
