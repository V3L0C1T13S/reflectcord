import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "../../../common/utils";
import { Guild } from "../../../common/models";

export default (express: Application) => <Resource> {
  post: async (req, res) => {
    const { name } = req.body;

    if (!name) throw new HTTPError("Guild must be named", 422);

    const server = await res.rvAPI.post("/servers/create", {
      name,
    });

    res.json(await Guild.from_quark(server.server));
  },
};
