/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { uploadBase64File } from "@reflectcord/cdn/util";
import { DbManager } from "@reflectcord/common/db";

export default (express: Application) => <Resource> {
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

    const file = Buffer.from(req.body);

    const autumn_id = await uploadBase64File("attachments", { file: file.toString("base64") });

    await DbManager.fileUploads.insertOne({
      upload_id,
      autumn_id,
    });

    res.sendStatus(200);
  },
};
