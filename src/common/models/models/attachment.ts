import { APIAttachment } from "discord.js";
import { API } from "revolt.js";
import { AutumnURL } from "../../constants";
import { QuarkConversion } from "../QuarkConversion";

export const Attachment: QuarkConversion<API.File, APIAttachment> = {
  async to_quark(attachment) {
    return {
      _id: attachment.id,
      filename: attachment.filename,
      tag: "Attachments",
      metadata: {
        type: "File",
      },
      size: attachment.size,
      content_type: "File",
    };
  },

  async from_quark(attachment) {
    const { _id, size } = attachment;

    const url = `http://localhost:3001/attachments/${_id}`;

    const { width, height } = attachment.metadata.type === "Image" ? attachment.metadata : {
      width: 0,
      height: 0,
    };

    return {
      id: _id,
      filename: "image.png",
      size,
      url,
      proxy_url: url,
      content_type: attachment.content_type,
      width,
      height,
    };
  },
};
