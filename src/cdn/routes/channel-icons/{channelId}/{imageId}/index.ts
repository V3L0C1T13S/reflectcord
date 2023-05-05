import { Resource } from "fastify-autoroutes";
import { ImageQuery, handleImgRequest } from "../../../../util";

export default () => <Resource> {
  get: {
    handler: async (req: ImageQuery, res) => {
      await handleImgRequest(req, res, "icons", req.params?.imageId);
    },
  },
};
