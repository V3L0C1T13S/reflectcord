import { AddUndefinedToPossiblyUndefinedPropertiesOfInterface } from "discord-api-types/utils/internals";
import { APIEmbed } from "discord.js";
import { API } from "revolt.js";
import { AutumnURL } from "../../constants";
import { hexToRgb, hexToRgbCode, rgbToHex } from "../../utils";
import { QuarkConversion } from "../QuarkConversion";

export const Embed: QuarkConversion<API.Embed, APIEmbed> = {
  async to_quark(embed) {
    const { title, description, color } = embed;

    return {
      type: "Text",
      title: title ?? null,
      description: description ?? null,
      colour: color ? rgbToHex(color) : null,
    };
  },

  async from_quark(embed) {
    switch (embed.type) {
      case "Text": {
        return {
          title: embed.title ?? "",
          description: embed.description ?? "",
          image: embed.media ? {
            url: `${AutumnURL}/attachments/${embed.media._id}`,
          } : null as any,
        };
      }
      case "Website": {
        return {
          title: embed.title ?? "",
          description: embed.description ?? "",
          url: embed.url ?? "",
        };
      }
      case "Video": {
        return {
          title: "Video",
          url: embed.url,
          video: {
            url: embed.url,
            width: embed.width,
            height: embed.height,
          },
        };
      }
      default: {
        return {};
      }
    }
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
    };
  },

  async from_quark(embed) {
    const {
      title, description, url, colour,
    } = embed;

    const convEmbed: APIEmbed = {
      title: title ?? " ",
      description: description ?? "fixme",
      url: url ?? "http://fixme",
    };

    if (colour) convEmbed.color = hexToRgbCode(colour)!;

    return convEmbed;
  },
};
