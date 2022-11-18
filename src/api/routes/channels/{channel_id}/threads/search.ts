import { Response } from "express";
import { Resource } from "express-automatic-routes";
import { ThreadSearchResponse } from "@reflectcord/common/sparkle";

export default () => <Resource> {
  get: (req, res: Response<ThreadSearchResponse>) => {
    res.json({
      threads: [],
      members: [],
      total_results: 0,
      has_more: false,
    });
  },
};
