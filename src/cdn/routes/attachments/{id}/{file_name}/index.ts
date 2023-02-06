import { Resource } from "express-automatic-routes";
import { handleAttachmentRequest } from "../index";

export default () => <Resource> {
  get: handleAttachmentRequest,
};
