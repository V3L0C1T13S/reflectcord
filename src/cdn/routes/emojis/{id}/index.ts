import { Application } from "express";
import { Resource } from "fastify-autoroutes";
import { fromSnowflake, tryFromSnowflake } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";
import { ImageQuery, handleImgRequest } from "../../../util";

export default () => <Resource> {
  post: {
    handler: (req, res) => {
      res.status(500).send();
    },
  },
  get: {
    handler: async (req: ImageQuery, res) => {
      if (!req.params?.id) throw new HTTPError("Invalid ID");
      const replacedId = req.params.id.replace(/\.[^/.]+$/, "");
      const emojiId = await fromSnowflake(replacedId);

      await handleImgRequest(req, res, "emojis", emojiId, true);
    },
  },
};
