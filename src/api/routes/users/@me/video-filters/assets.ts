import { VideoFilterResponse } from "@reflectcord/common/sparkle";
import { Response } from "express";
import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res: Response<VideoFilterResponse>) => {
    res.json([]);
  },
};
