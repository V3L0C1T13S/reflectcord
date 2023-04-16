import { ImageQuery, handleImgRequest } from "cdn/util";
import { Resource } from "fastify-autoroutes";

export default () => <Resource> {
  get: {
    handler: (req: ImageQuery, res) => handleImgRequest(req, res, "backgrounds", req.params.imageId),
  },
};
