import { Resource } from "fastify-autoroutes";
import Ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import {
  existsSync, mkdirSync, readFileSync, writeFileSync,
} from "fs";
import gm from "gm";
import { join } from "path";
import axios from "axios";
import { Logger } from "@reflectcord/common/utils";
import { gifBoxAPIUrl } from "@reflectcord/common/constants";
import { ImageQuery, getMimeType, imageCacheDir } from "../../../util";

if (ffmpegPath) {
  Ffmpeg.setFfmpegPath(ffmpegPath);
}

const webpDir = join(imageCacheDir, "gifbox");
const gifDir = join(webpDir, "__gifscache");
const mp4Dir = join(webpDir, "__mp4cache");

if (!existsSync(webpDir)) mkdirSync(webpDir);
if (!existsSync(gifDir)) mkdirSync(gifDir);
if (!existsSync(mp4Dir)) mkdirSync(mp4Dir);

export default () => <Resource> {
  get: {
    handler: async (req: ImageQuery, res) => {
      if (!req.params) throw new Error("params are required");
      const { gifId } = req.params;

      if (!gifId) return res.status(404).send();

      const webpFile = join(webpDir, gifId);
      const gifFile = `${join(gifDir, gifId)}.gif`;
      const mp4File = `${join(mp4Dir, gifId)}.gif.mp4`;

      if (existsSync(mp4File)) {
        const data = readFileSync(mp4File);
        res.header("Content-Type", await getMimeType(data));

        return res.send(data);
      }

      if (!existsSync(webpFile)) writeFileSync(webpFile, (await axios.get(`${gifBoxAPIUrl}/file/posts/${gifId}`, { responseType: "arraybuffer" })).data);

      /**
     * FIXME: This is awful since ffmpeg doesn't support webp->mp4 directly
     * But really, it's googles fault who, in their infinite and unending wisdom,
     * thought a format that combines images, audio, and video was a great idea.
    */
      return (gm.subClass({ imageMagick: true }))(webpFile)
        .write(gifFile, (e) => {
          if (e) return Logger.error(e);

          return Ffmpeg()
            .input(gifFile)
            .noAudio()
            .outputOptions("-pix_fmt yuv420p")
            .output(mp4File)
            .on("end", async () => {
              const mp4Data = readFileSync(mp4File);

              res.header("Content-Type", await getMimeType(mp4Data));

              res.send(mp4Data);
            })
            .on("error", () => {
              res.status(500).send();
            })
            .run();
        });
    },
  },
};
