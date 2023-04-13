import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { gifBoxAPIUrl, reflectcordCDNURL, urlScheme } from "@reflectcord/common/constants";
import { GifboxClient } from "@reflectcord/common/rvapi";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const gbClient = new GifboxClient();

    const popularGifs = await gbClient.posts.popularPosts(20, 0);

    const popularGifCategories = popularGifs.map((x) => x.tags.first() ?? "fixme")
      .unique();

    res.json({
      categories: popularGifCategories.map((x) => {
        const gif = `${urlScheme}://${reflectcordCDNURL}/gifs/${popularGifs.filter((g) => g.tags.includes(x)).random()?.file.fileName}`;

        return {
          name: x,
          src: gif,
        };
      }),
      gifs: popularGifs.map((x) => {
        const gbSrc = `${gifBoxAPIUrl}/file/posts/${x.file.fileName}`;
        const cdnPreview = `${urlScheme}://${reflectcordCDNURL}/gifs/${x.file.fileName}`;

        return {
          id: x._id,
          title: x.title,
          url: gbSrc,
          src: gbSrc,
          gif_src: cdnPreview,
          width: 256,
          height: 256,
          preview: cdnPreview,
        };
      }),
    });
  },
};
