/* eslint-disable camelcase */
import { AddUndefinedToPossiblyUndefinedPropertiesOfInterface } from "discord-api-types/utils/internals";
import { APIEmbed, APIEmbedImage, APIEmbedVideo } from "discord.js";
import { API } from "revolt.js";
import axios from "axios";
import { uploadFile } from "@reflectcord/cdn/util";
import fileType from "file-type";
import { TwitterApi } from "twitter-api-v2";
import { Logger, hexToRgbCode, rgbToHex } from "../../utils";
import { proxyFile } from "../../rvapi";
import { QuarkConversion } from "../QuarkConversion";
import {
  AutumnURL, embedEnableSpecials, reflectcordCDNURL, TwitterAPIBearer,
} from "../../constants";

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

  // FIXME: Spaghetti momento
  async from_quark(embed) {
    if (embed.type === "None") return {};

    const discordEmbed: APIEmbed = {};
    if (embed.url) discordEmbed.url = embed.url;
    if (embed.type === "Text" || embed.type === "Website") {
      if (embed.title) discordEmbed.title = embed.title;
      if (embed.description) discordEmbed.description = embed.description;
      if (embed.colour) discordEmbed.color = hexToRgbCode(embed.colour) ?? 0;
      if (embed.icon_url) {
        discordEmbed.thumbnail = {
          url: embed.icon_url,
          proxy_url: proxyFile(embed.icon_url),
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
          proxy_url: "",
          width: 0,
          height: 0,
        };
        if (embed.image) {
          mediaInfo.width = embed.image.width;
          mediaInfo.height = embed.image.height;
          mediaInfo.url = embed.image.url;
          mediaInfo.proxy_url = proxyFile(embed.image.url);

          discordEmbed.image = mediaInfo;
        } else if (embed.video) {
          mediaInfo.width = embed.video.width;
          mediaInfo.height = embed.video.height;
          mediaInfo.url = embed.video.url;
          mediaInfo.proxy_url = proxyFile(embed.video.url);

          discordEmbed.video = mediaInfo;
        }

        mediaInfo.url = mediaInfo.url ?? "";
        mediaInfo.proxy_url = proxyFile(mediaInfo.url);
      }
    } else {
      const mediaInfo: APIEmbedImage | APIEmbedVideo = {
        url: embed.url,
        proxy_url: proxyFile(embed.url),
        width: embed.width,
        height: embed.height,
      };
      if (embed.type === "Image") {
        discordEmbed.image = mediaInfo as APIEmbedImage;
        // @ts-ignore
        discordEmbed.type = "image";
      } else if (embed.type === "Video") {
        const attachmentId = embed.url.split("/").at(-2);
        const isAutumn = mediaInfo.url?.startsWith(AutumnURL);

        if (isAutumn) {
          mediaInfo.proxy_url = `http://${reflectcordCDNURL}/attachments/${attachmentId}`;
        }

        discordEmbed.video = mediaInfo;

        discordEmbed.thumbnail = {
          url: isAutumn ? `${mediaInfo.proxy_url}?format=jpeg` : mediaInfo.url ?? "",
          proxy_url: mediaInfo.proxy_url ?? "",
          width: embed.width,
          height: embed.height,
        };
        if (isAutumn) delete discordEmbed.thumbnail.proxy_url;

        // @ts-ignore
        discordEmbed.type = "video";
      }
    }

    if (embed.type === "Website" && embedEnableSpecials && embed.special?.type) {
      switch (embed.special.type) {
        case "YouTube": {
          discordEmbed.provider = {
            name: "YouTube",
            url: "https://www.youtube.com",
          };

          discordEmbed.author = {
            name: "Unknown",
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
              width: embed.image.width,
              height: embed.image.height,
            };
          }

          delete discordEmbed.image;

          // @ts-ignore
          discordEmbed.type = "video";

          break;
        }
        case "Twitch": {
          discordEmbed.provider = {
            name: "Twitch",
          };

          if (embed.image) {
            discordEmbed.thumbnail = {
              url: embed.image.url,
              proxy_url: proxyFile(embed.image.url),
              width: embed.image.width,
              height: embed.image.height,
            };
          }

          if (embed.video) {
            discordEmbed.video = {
              url: embed.video.url,
              width: embed.video.width,
              height: embed.video.height,
            };
          }

          delete discordEmbed.image;

          // @ts-ignore
          discordEmbed.type = "video";

          break;
        }
        case "Bandcamp": {
          // @ts-ignore
          discordEmbed.type = "link";

          discordEmbed.provider = {
            name: embed.site_name ?? "Bandcamp",
          };

          if (embed.image) {
            discordEmbed.thumbnail = {
              url: embed.image.url,
              proxy_url: proxyFile(embed.image.url),
              width: embed.image.width,
              height: embed.image.height,
            };
          }

          if (embed.video) {
            discordEmbed.video = {
              url: embed.video.url,
              width: embed.video.width,
              height: embed.video.height,
            };
          }

          delete discordEmbed.image;

          break;
        }
        case "None":
        default:
      }

      try {
        // TODO
        if (embed.url?.startsWith("https://nitter.net/") && TwitterAPIBearer) {
          const twitterClient = new TwitterApi(TwitterAPIBearer);
          const readOnlyClient = twitterClient.readOnly;

          const tweetRegexp = /\/status\/(\d+)/gs;

          // @ts-ignore
          discordEmbed.type = "rich";

          const extractedAuthor = embed.title?.split("(").pop();
          const extractedAuthorName = extractedAuthor?.substring(0, extractedAuthor.length - 1)!;

          const tweetId = embed.url.match(tweetRegexp)?.[0]?.split("/").at(-1);

          if (!tweetId) throw new Error("Couldn't extract tweet ID from message");

          const user = await readOnlyClient.v2
            .userByUsername(extractedAuthorName.substring(1, extractedAuthorName.length), {
              "user.fields": ["profile_image_url"],
            });

          const tweet = await readOnlyClient.v2.singleTweet(tweetId, {
            "tweet.fields": ["public_metrics", "created_at"],
          });

          const twitterIcon = "https://abs.twimg.com/icons/apple-touch-icon-192x192.png";

          discordEmbed.author = {
            name: embed.title ?? extractedAuthorName,
            url: `https://nitter.net/${extractedAuthorName}`,
            icon_url: user.data.profile_image_url ?? twitterIcon,
            proxy_icon_url: proxyFile(user.data.profile_image_url ?? twitterIcon),
          };

          discordEmbed.fields = [{
            name: "Likes",
            value: tweet.data.public_metrics?.like_count.toString() ?? "0",
            inline: true,
          }, {
            name: "Retweets",
            value: tweet.data.public_metrics?.retweet_count.toString() ?? "0",
            inline: true,
          }];

          discordEmbed.footer = {
            text: "Twitter",
            icon_url: twitterIcon,
            proxy_icon_url: proxyFile(twitterIcon),
          };

          if (embed.video) {
            delete discordEmbed.image;

            if (embed.image) {
              discordEmbed.thumbnail = {
                url: embed.image.url,
                proxy_url: proxyFile(embed.image.url),
                width: embed.image.width,
                height: embed.image.height,
              };
            }

            discordEmbed.video = {
              url: `https://twitter.com/i/videos/tweet/${tweetId}`,
              width: embed.image?.width ?? embed.video.width,
              height: embed.image?.height ?? embed.video.height,
            };
          }

          discordEmbed.timestamp = tweet.data.created_at ?? new Date().toISOString();

          discordEmbed.color = 1942002;

          // Clearing fields that aren't accurate to real Discord
          // delete discordEmbed.url;
          delete discordEmbed.title;
        }
      } catch (e) {
        Logger.warn(`Couldn't properly convert nitter embed ${e}`);
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
