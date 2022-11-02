import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { gifBoxAPIUrl, gifBoxURL, reflectcordCDNURL } from "../../../common/constants";
import { GifboxClient } from "../../../common/rvapi";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const gbClient = new GifboxClient();

    const popularGifs = await gbClient.posts.popularPosts(10, 0);

    res.json(popularGifs.map((x) => {
      const gbSrc = `${gifBoxAPIUrl}/file/posts/${x.file.fileName}`;
      const gbURL = `${gifBoxURL}/view/${x._id}-${x.slug}`;
      const cdnPreview = `${reflectcordCDNURL}/gifs/${x.file.fileName}`;

      return {
        id: x._id,
        title: x.title,
        url: gbURL,
        src: gbSrc,
        gif_src: gbSrc,
        width: 256,
        height: 256,
        preview: gbSrc,
      };
    }));
  },
};
