/* eslint-disable camelcase */
import { AddUndefinedToPossiblyUndefinedPropertiesOfInterface } from "discord-api-types/utils/internals";
import { APIEmbed } from "discord.js";
import { API } from "revolt.js";
import { Logger } from "@reflectcord/common/utils";
import axios from "axios";
import { uploadFile } from "@reflectcord/cdn/util";
import fileType from "file-type";
import { proxyFile } from "../../rvapi";
import { hexToRgbCode, rgbToHex } from "../../utils";
import { QuarkConversion } from "../QuarkConversion";
import { embedEnableSpecials, reflectcordCDNURL } from "../../constants";

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
      if (embed.icon_url) {
        const imgUrl = proxyFile(embed.icon_url);
        discordEmbed.thumbnail = {
          url: imgUrl,
          proxy_url: imgUrl,
        };
      }
      if (embed.type === "Text") {
        if (embed.media) {
          const imgUrl = `http://${reflectcordCDNURL}/attachments/${embed.media._id}`;
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

    if (embed.type === "Website" && embedEnableSpecials && embed.special?.type) {
      switch (embed.special.type) {
        case "YouTube": {
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

          break;
        }
        case "Spotify": {
          discordEmbed.provider = {
            name: "Spotify",
            url: "https://spotify.com/",
          };

          delete discordEmbed.image;

          if (embed.url) {
            discordEmbed.url = embed.url;
          }

          // @ts-ignore
          discordEmbed.type = "link";

          break;
        }
        case "Soundcloud": {
          discordEmbed.provider = {
            name: "SoundCloud",
            url: "https://soundcloud.com/",
          };

          discordEmbed.author = {
            name: "Unknown",
            url: "https://soundcloud.com",
          };

          if (embed.url) {
            discordEmbed.video = {
              url: `https://w.soundcloud.com/player/?url=${encodeURI(embed.url)}&auto_play=false&show_artwork=true&visual=true&origin="twitter"`,
              width: 435,
              height: 400,
            };
          }

          if (embed.image) {
            discordEmbed.thumbnail = {
              url: embed.image.url,
              proxy_url: proxyFile(embed.image.url),
              width: 500,
              height: 500,
            };
          }

          delete discordEmbed.image;

          // @ts-ignore
          discordEmbed.type = "video";

          break;
        }
        case "None":
        default:
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
      title, description, url, fields, footer, color, image,
    } = embed;

    const rvEmbed: API.SendableEmbed = {
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

    if (image?.url) {
      try {
        const imageData = Buffer.from(
          (await axios.get(image.url, { responseType: "arraybuffer" })).data,
        );

        const rvId = await uploadFile("attachments", {
          name: "embed.png",
          file: imageData,
        }, (await fileType.fromBuffer(imageData))?.mime ?? "image/png").catch(() => null);

        rvEmbed.media = rvId;
      } catch (e) {
        Logger.error(e);
      }
    }

    return rvEmbed;
  },

  async from_quark(embed) {
    const {
      title, description, url, colour, icon_url,
    } = embed;

    const convEmbed: APIEmbed = {};

    if (title) convEmbed.title = title;
    if (description) convEmbed.description = description;
    if (url) convEmbed.url = url;

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
