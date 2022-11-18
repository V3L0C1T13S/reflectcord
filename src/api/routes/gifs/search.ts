/* eslint-disable camelcase */
import { Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { PostSearchResponse } from "gifbox.js/src/types/Responses";
import { gifBoxAPIUrl, gifBoxURL, reflectcordCDNURL } from "../../../common/constants";
import { GifboxClient } from "../../../common/rvapi";
import { HTTPError } from "../../../common/utils/HTTPError";

export function convertGifsArray(gifs: PostSearchResponse, video = false) {
  return gifs.hits.map((x) => {
    const gbSrc = `${gifBoxAPIUrl}/file/posts/${x.file.fileName}`;
    const gbURL = `${gifBoxURL}/view/${x._id}-${x.slug}`;
    const cdnPreview = video ? `http://${reflectcordCDNURL}/gifs/${x.file.fileName}` : gbSrc;

    return {
      id: x._id,
      title: x.title,
      url: gbURL,
      src: cdnPreview,
      gif_src: cdnPreview,
      width: 256,
      height: 256,
      preview: cdnPreview,
    };
  });
}

export async function searchGifs(req: Request, res: Response, video = false) {
  const gbClient = new GifboxClient();

  const { q, media_format, locale } = req.query;

  if (typeof q !== "string") throw new HTTPError("Invalid query");

  const gifResults = await gbClient.posts.search(q, 20, 0);

  res.json(convertGifsArray(gifResults, video));
}

export default () => <Resource> {
  get: async (req, res) => {
    await searchGifs(req, res, true);
  },
};
