import { FastifyRequest, FastifyReply } from "fastify";
import { Resource } from "fastify-autoroutes";
import { ImageQuery, handleImgRequest } from "../../../util";

export const handleAttachmentRequest = (req: ImageQuery, res: FastifyReply) => handleImgRequest(req, res, "attachments", req.params.id);

export default () => <Resource> {
  get: {
    handler: handleAttachmentRequest,
  },
};
