import { Resource } from "fastify-autoroutes";
import { handleAttachmentRequest } from "../index";

export default () => <Resource> {
  get: { handler: handleAttachmentRequest },
};
