import { Response } from "express";
import { Resource } from "express-automatic-routes";
import { ThreadSearchResponse } from "../../../../../common/sparkle";

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
