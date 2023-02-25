import { Resource } from "express-automatic-routes";
import { Request } from "express";
import { RESTPostAPIInteractionCallbackJSONBody } from "discord.js";

export default () => <Resource> {
  post: async (req: Request<{}, RESTPostAPIInteractionCallbackJSONBody>, res) => {
    res.sendStatus(204);
  },
};
