/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { fromSnowflake } from "../../../../common/models/util";
import { Channel } from "../../../../common/models";
import { HTTPError } from "../../../../common/utils";

export default (express: Application) => <Resource> {
  post: async (req, res) => {
    // FIXME
    const { id } = req.params;
    if (!id) throw new HTTPError("Invalid id");

    // const rvId = await fromSnowflake(id);

    res.sendStatus(204);
  },
};
