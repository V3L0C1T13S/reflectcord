/* eslint-disable camelcase */
import { AddUndefinedToPossiblyUndefinedPropertiesOfInterface } from "discord-api-types/utils/internals";
import { APIEmbed } from "discord.js";
import { API } from "revolt.js";
import { proxyFile } from "../../rvapi";
import { hexToRgbCode, rgbToHex } from "../../utils";
import { QuarkConversion } from "../QuarkConversion";
import { embedEnableSpecials } from "../../constants";

export const Embed: QuarkConversion<API.Embed, APIEmbed> = {
  async to_quark(embed) {
    const {
      title, description, color, url,
    } = embed;

    return {
      type: "Text",
      title: title ?? null,
      description: description ?? null,
      colour: color ? rgbToHex(color) : null,
      url: url ?? null,
    };
  },

  async from_quark(embed) {
    if (embed.type === "None") return {};

    const discordEmbed: APIEmbed = {};
    if (embed.url) discordEmbed.url = embed.url;
    if (embed.type === "Text" || embed.type === "Website") {
      if (embed.title) discordEmbed.title = embed.title;
      if (embed.description) discordEmbed.description = embed.description;
      if (embed.colour) discordEmbed.color = hexToRgbCode(embed.colour) ?? 0;
      if (embed.type === "Text") {
        if (embed.media) {
          const imgUrl = `http://localhost:3001/attachments/${embed.media._id}`;
          discordEmbed.image = {
            url: imgUrl,
            proxy_url: imgUrl,
            width: embed.media.metadata.type === "Image" ? embed.media.metadata.width : 0,
            height: embed.media.metadata.type === "Image" ? embed.media.metadata.height : 0,
          };
        }
      } else if (embed.image || embed.video) {
        const mediaInfo = {
          url: "",
          width: 0,
          height: 0,
        };
        if (embed.image) {
          mediaInfo.width = embed.image.width;
          mediaInfo.height = embed.image.height;
          mediaInfo.url = proxyFile(embed.image.url);

          discordEmbed.image = mediaInfo;
        } else if (embed.video) {
          mediaInfo.width = embed.video.width;
          mediaInfo.height = embed.video.height;
          mediaInfo.url = proxyFile(embed.video.url);

          discordEmbed.video = mediaInfo;
        }

        mediaInfo.url = proxyFile(mediaInfo.url);
      }
    } else {
      const mediaInfo = {
        url: proxyFile(embed.url),
        width: embed.width,
        height: embed.height,
      };
      if (embed.type === "Image") {
        discordEmbed.image = mediaInfo;
      } else if (embed.type === "Video") {
        discordEmbed.video = mediaInfo;
      }
    }

    if (embed.type === "Website" && embed.special?.type === "YouTube" && embedEnableSpecials) {
      discordEmbed.provider = {
        name: "YouTube",
        url: "https://www.youtube.com",
      };

      delete discordEmbed.image;

      if (embed.video && embed.url) {
        discordEmbed.video = {
          url: embed.video.url,
          width: embed.video.width,
          height: embed.video.height,
        };

        if (embed.image) {
          discordEmbed.thumbnail = {
            url: embed.image.url,
            width: embed.image.width,
            height: embed.image.height,
            proxy_url: proxyFile(embed.image.url),
          };
        }

        discordEmbed.url = embed.url;

        // @ts-ignore
        discordEmbed.type = "video";
      }
    }

    return discordEmbed;
  },
};

export const SendableEmbed: QuarkConversion<
  API.SendableEmbed,
  AddUndefinedToPossiblyUndefinedPropertiesOfInterface<APIEmbed>
> = {
  async to_quark(embed) {
    const {
      title, description, url, fields, footer, color,
    } = embed;

    return {
      title: title ?? null,
      description: (() => {
        let realDescription = description ?? "";

        fields?.forEach((field) => {
          realDescription += `\n\n**${field.name}**\n\n${field.value}`;
        });

        if (footer) realDescription += `\n\n${footer.text}`;

        return realDescription;
      })(),
      url: url ?? null,
      colour: color ? rgbToHex(color) : null,
      icon_url: embed.footer?.icon_url ?? null,
    };
  },

  async from_quark(embed) {
    const {
      title, description, url, colour, icon_url,
    } = embed;

    const convEmbed: APIEmbed = {
      title: title ?? " ",
      description: description ?? "fixme",
      url: url ?? "http://fixme",
    };

    if (colour) convEmbed.color = hexToRgbCode(colour)!;
    if (icon_url) {
      convEmbed.footer = {
        text: "Footer",
        icon_url,
      };
    }

    return convEmbed;
  },
};
