/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "../../../../common/utils";

export default (express: Application) => <Resource> {
  post: async (req, res) => {
    // FIXME
    const { channel_id } = req.params;
    if (!channel_id) throw new HTTPError("Invalid id");

    // const rvId = await fromSnowflake(id);

    res.sendStatus(204);
  },
};
