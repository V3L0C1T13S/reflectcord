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
  $waveform: String,
  $duration_secs: Number,
};

export type AttachmentSchema = APIAttachment & {
  uploaded_filename?: string,
  duration_secs?: number,
  waveform?: string,
};

export const FileIsNewAttachment = (file: any): file is AttachmentSchema => "uploaded_filename" in file;

export const FileIsWaveform = (file: any): file is AttachmentSchema => FileIsNewAttachment(file) && "duration_secs" in file && "waveform" in file;
