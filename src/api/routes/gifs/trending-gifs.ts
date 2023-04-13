import { Application } from "express";
import { Resource } from "express-automatic-routes";
import {
  gifBoxAPIUrl, gifBoxURL, reflectcordCDNURL, urlScheme,
} from "@reflectcord/common/constants";
import { GifboxClient } from "@reflectcord/common/rvapi";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const gbClient = new GifboxClient();

    const popularGifs = await gbClient.posts.popularPosts(100, 0);

    res.json(popularGifs.map((x) => {
      const gbSrc = `${gifBoxAPIUrl}/file/posts/${x.file.fileName}`;
      const gbURL = `${gifBoxURL}/view/${x._id}-${x.slug}`;
      const cdnPreview = `${urlScheme}://${reflectcordCDNURL}/gifs/${x.file.fileName}`;

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
