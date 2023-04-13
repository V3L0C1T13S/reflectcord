/* eslint-disable camelcase */
import { reflectcordCDNURL, urlScheme } from "@reflectcord/common/constants";
import { APIAttachment } from "discord.js";
import { API } from "revolt.js";
import { QuarkConversion } from "../QuarkConversion";
import { hashToSnowflake } from "../util";

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

    const id = await hashToSnowflake(_id);
    const url = `${urlScheme}://${reflectcordCDNURL}/attachments/${id}/${attachment.filename}`;

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

    const discordAttachment: APIAttachment = {
      id,
      filename: attachment.filename,
      size,
      url,
      proxy_url: url,
      content_type,
    };

    if (width && height) {
      discordAttachment.width = width;
      discordAttachment.height = height;
    }

    if (discordAttachment.content_type?.startsWith("text/plain")) {
      discordAttachment.content_type = `${discordAttachment.content_type}; charset=utf-8`;
    }

    return discordAttachment;
  },
};

export const PartialFile: QuarkConversion<API.File, string, {}, { skipConversion?: boolean }> = {
  async to_quark(file) {
    return {
      _id: file,
      filename: "file",
      size: 0,
      metadata: {
        type: "File",
      },
      content_type: "application/octet-stream",
      tag: "Attachments",
    };
  },

  async from_quark(file, extra) {
    if (extra?.skipConversion) return file._id;
    // TODO: Figure out when conversion is appropriate
    return hashToSnowflake(file._id);
  },
};
