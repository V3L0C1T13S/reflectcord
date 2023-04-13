/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { appData } from "@reflectcord/common/utils";
import axios from "axios";
import { discordBaseURL } from "@reflectcord/common/constants";
import { handleImgRequest } from "../../../../util";

export default () => <Resource> {
  get: async (req, res) => {
    const { avatar_id, app_id } = req.params;

    const app = await appData.findOne({ id: app_id, icon: avatar_id });

    if (app) {
      const downloadedIcon = await axios.get(`cdn.discordapp.com/app-icons/${app_id}/${avatar_id}`, { responseType: "arraybuffer" });

      res.send(downloadedIcon.data);
    } else handleImgRequest(req, res, "avatars", avatar_id, true);
  },
};
