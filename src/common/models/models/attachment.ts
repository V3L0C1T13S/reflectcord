/* eslint-disable camelcase */
import { reflectcordCDNURL } from "@reflectcord/common/constants";
import { APIAttachment } from "discord.js";
import { API } from "revolt.js";
import { QuarkConversion } from "../QuarkConversion";

export const Attachment: QuarkConversion<API.File, APIAttachment> = {
  async to_quark(attachment) {
    const { content_type } = attachment;

    const rvType: API.File["metadata"]["type"] = (() => {
      if (content_type?.startsWith("image")) return "Image";
      if (content_type?.startsWith("video")) return "Video";
      if (content_type?.startsWith("audio")) return "Audio";
      if (content_type?.startsWith("text")) return "Text";

      return "File";
    })();

    const metadata: any = {
      type: rvType,
    };

    if (metadata.type === "Image" || metadata.type === "Video") {
      metadata.width = attachment.width ?? 0;
      metadata.height = attachment.height ?? 0;
    }

    return {
      _id: attachment.id,
      filename: attachment.filename,
      tag: "Attachments",
      metadata,
      size: attachment.size,
      content_type: content_type ?? "application/octet-stream",
    };
  },

  async from_quark(attachment) {
    const { _id, size, content_type } = attachment;

    const url = `http://${reflectcordCDNURL}/attachments/${_id}`;

    const { width, height } = (() => {
      if (attachment.metadata.type === "Image" || attachment.metadata.type === "Video") {
        return {
          width: attachment.metadata.width,
          height: attachment.metadata.height,
        };
      }

      return {
        width: null,
        height: null,
      };
    })();

    return {
      id: _id,
      filename: attachment.filename,
      size,
      url,
      proxy_url: url,
      width,
      height,
      content_type,
    };
  },
};
