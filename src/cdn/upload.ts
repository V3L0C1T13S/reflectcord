/* eslint-disable camelcase */
import { Router } from "express";
import { HTTPError } from "@reflectcord/common/utils";
import { UploadedFile } from "@reflectcord/common/mongoose";
import { uploadFile } from "./util";

export const upload = Router();

upload.use((req, res, next) => {
  let buffer = Buffer.alloc(0, undefined, "binary");
  req.setEncoding("binary");
  req.on(
    "data",
    // eslint-disable-next-line no-return-assign
    (chunk: string) => (buffer = Buffer.concat([buffer, Buffer.from(chunk, "binary")])),
  );
  req.on("end", () => {
    req.body = buffer;
    next();
  });
});

upload.put("/", async (req, res) => {
  const { upload_id } = req.query;
  const content_type = req.headers["content-type"];

  if (typeof upload_id !== "string") throw new HTTPError("Invalid upload id query");
  if (typeof content_type !== "string") throw new HTTPError("Bad content-type header");

  const uploadedFile = await UploadedFile.findById(upload_id);
  if (!uploadedFile) throw new HTTPError("File does not exist", 404);
  if (uploadedFile.autumn_id) throw new HTTPError("This file has already been uploaded", 403);
  const file = req.body;

  const autumn_id = await uploadFile("attachments", {
    file,
    name: uploadedFile.info.name,
  }, content_type);

  uploadedFile.autumn_id = autumn_id;
  await uploadedFile.save();

  res.status(200).send();
});
