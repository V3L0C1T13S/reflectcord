import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { gifBoxAPIUrl } from "../../../common/constants";
import { GifboxClient } from "../../../common/rvapi/gifbox";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const gbClient = new GifboxClient();

    const popularGifs = await gbClient.posts.popularPosts(10, 0);

    const popularGifCategories = popularGifs.map((x) => x.tags.first() ?? "fixme")
      .unique();

    res.json({
      categories: popularGifCategories.map((x) => ({
        name: x,
        src: `${gifBoxAPIUrl}/file/posts/${popularGifs.first()?.file.fileName}`,
      })),
      gifs: popularGifs.map((x) => {
        const gbSrc = `${gifBoxAPIUrl}/file/posts/${x.file.fileName}`;

        return {
          id: x._id,
          title: x.title,
          url: gbSrc,
          src: gbSrc,
          gif_src: gbSrc,
          width: 256,
          height: 256,
          preview: gbSrc,
        };
      }),
    });
  },
};
