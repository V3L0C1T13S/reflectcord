import { Resource } from "fastify-autoroutes";
import { ImageQuery, handleImgRequest } from "../../../../../../../util";

export default () => <Resource> {
  get: { handler: (req: ImageQuery, res) => handleImgRequest(req, res, "avatars", req.params.avatarId, true) },
};
