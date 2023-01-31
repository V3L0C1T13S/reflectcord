/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { uploadFile } from "@reflectcord/cdn/util";
import { UploadedFile } from "@reflectcord/common/mongoose";
import { HTTPError } from "@reflectcord/common/utils";

export default () => <Resource> {
  options: (req, res) => {
    res.set("access-control-allow-credentials", "true");
    res.set("access-control-allow-headers", "content-type");
    res.set("access-control-allow-methods", "PUT");
    res.set("content-length", "0");
    res.set("content-type", "text/plain; charset=utf-8");
    res.set("date", new Date().toDateString());
    res.set("server", "UploadServer");
    res.removeHeader("X-Powered-By");
    res.removeHeader("Content-security-policy");

    res.status(200).send();
  },
  put: async (req, res) => {
    const { upload_id } = req.query;

    if (typeof upload_id !== "string") throw new HTTPError("Invalid upload id query");

    const uploadedFile = await UploadedFile.findById(upload_id);
    if (!uploadedFile) throw new HTTPError("File does not exist", 404);
    if (uploadedFile.autumn_id) throw new HTTPError("This file has already been uploaded", 401);
    const file = Buffer.from(req.body);

    const autumn_id = await uploadFile("attachments", {
      file,
      name: uploadedFile.info.name,
    });

    uploadedFile.autumn_id = autumn_id;
    await uploadedFile.save();

    res.sendStatus(200);
  },
};
