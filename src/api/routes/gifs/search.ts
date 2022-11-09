/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { gifBoxAPIUrl, gifBoxURL, reflectcordCDNURL } from "../../../common/constants";
import { GifboxClient } from "../../../common/rvapi";
import { HTTPError } from "../../../common/utils/HTTPError";

export default () => <Resource> {
  get: async (req, res) => {
    const gbClient = new GifboxClient();

    const { q, media_format, locale } = req.query;

    if (typeof q !== "string") throw new HTTPError("Invalid query");

    const gifResults = await gbClient.posts.search(q, 20, 0);

    res.json(gifResults.hits.map((x) => {
      const gbSrc = `${gifBoxAPIUrl}/file/posts/${x.file.fileName}`;
      const gbURL = `${gifBoxURL}/view/${x._id}-${x.slug}`;
      const cdnPreview = `http://${reflectcordCDNURL}/gifs/${x.file.fileName}`;

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
    }));
  },
};
