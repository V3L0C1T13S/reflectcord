import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { toSnowflake } from "../../../common/models/util";
import { HTTPError } from "../../../common/utils";

export default (express: Application) => <Resource> {
  post: async (req, res) => {
    const { name } = req.body;

    if (!name) throw new HTTPError("Guild must be named", 422);

    const server = await res.rvAPI.post("/servers/create", {
      name,
    });

    res.json({
      id: await toSnowflake(server.server._id),
    });
  },
};
