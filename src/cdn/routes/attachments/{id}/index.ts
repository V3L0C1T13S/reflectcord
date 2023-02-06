import { Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { handleImgRequest } from "../../../util";

export const handleAttachmentRequest = (req: Request, res: Response) => handleImgRequest(req, res, "attachments", req.params.id);

export default () => <Resource> {
  get: handleAttachmentRequest,
};
