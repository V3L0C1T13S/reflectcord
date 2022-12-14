/* eslint-disable no-redeclare */
import { APIAttachment } from "discord.js";
import { Tuple } from "../../../../utils";

export const AttachmentSchema = {
  $id: String,
  $filename: String,
  $description: String,
  $content_type: String,
  $size: Number,
  $url: String,
  $proxy_url: String,
  $height: new Tuple(Number, null),
  $width: new Tuple(Number, null),
  $ephemeral: Boolean,
};

export type AttachmentSchema = APIAttachment;
