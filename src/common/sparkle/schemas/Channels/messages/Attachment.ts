/* eslint-disable no-redeclare */
import { APIAttachment } from "discord.js";
import { Tuple } from "../../../../utils";

export const AttachmentSchema = {
  $id: String,
  $filename: String,
  $uploaded_filename: String, // TODO (docs)
  $description: String,
  $content_type: String,
  $size: Number,
  $url: String,
  $proxy_url: String,
  $height: new Tuple(Number, null),
  $width: new Tuple(Number, null),
  $ephemeral: Boolean,
};

export type AttachmentSchema = APIAttachment & {
  uploaded_filename?: string,
};

export const FileIsNewAttachment = (file: any): file is AttachmentSchema => "uploaded_filename" in file;
