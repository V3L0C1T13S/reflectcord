import { APIEmbed } from "discord.js";
import { API } from "revolt.js";
import { QuarkConversion } from "../QuarkConversion";

export const Embed: QuarkConversion<API.Embed, APIEmbed> = {
  async to_quark(embed) {
    const { title, description } = embed;

    return {
      type: "Text",
      title: title ?? null,
      description: description ?? null,
    };
  },

  async from_quark(embed) {
    switch (embed.type) {
      case "Text": {
        return {
          title: embed.title ?? "",
          description: embed.description ?? "",
        };
      }
      default: {
        return {};
      }
    }
  },
};
