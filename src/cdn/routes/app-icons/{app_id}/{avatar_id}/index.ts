/* eslint-disable camelcase */
import { Resource } from "fastify-autoroutes";
import { appData } from "@reflectcord/common/utils";
import axios from "axios";
import { ImageQuery, handleImgRequest } from "../../../../util";

export default () => <Resource> {
  get: {
    handler: async (req: ImageQuery, res) => {
      if (!req.params) throw new Error("Params are required.");

      const { avatar_id, app_id } = req.params;

      const app = await appData.findOne({ id: app_id, icon: avatar_id });

      if (app) {
        const downloadedIcon = await axios.get(`cdn.discordapp.com/app-icons/${app_id}/${avatar_id}`, { responseType: "arraybuffer" });

        res.send(downloadedIcon.data);
      } else handleImgRequest(req, res, "avatars", avatar_id, true);
    },
  },
};
