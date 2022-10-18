/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { fromSnowflake } from "../../../../common/models/util";
import { Channel } from "../../../../common/models";
import { HTTPError } from "../../../../common/utils";

export default (express: Application) => <Resource> {
  post: async (req, res) => {
    res.json([]);
  },
};
