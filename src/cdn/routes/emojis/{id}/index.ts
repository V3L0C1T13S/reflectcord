import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { tryFromSnowflake } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";
import { handleImgRequest } from "../../../util";

export default (express: Application) => <Resource> {
  post: (req, res) => {
    res.sendStatus(500);
  },
  get: async (req, res) => {
    if (!req.params.id) throw new HTTPError("Invalid ID");
    const replacedId = req.params.id.replace(/\.[^/.]+$/, "");
    const emojiId = await tryFromSnowflake(replacedId);

    await handleImgRequest(req, res, "emojis", emojiId);
  },
};
