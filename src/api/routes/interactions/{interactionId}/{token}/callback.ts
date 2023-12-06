import { Resource } from "express-automatic-routes";
import { Request } from "express";
import { InteractionResponseType, RESTPostAPIInteractionCallbackJSONBody } from "discord.js";
import { HTTPError } from "@reflectcord/common/utils";
import { createAPI } from "@reflectcord/common/rvapi";

export default () => <Resource> {
  post: async (req: Request<
      { token: string }, any, RESTPostAPIInteractionCallbackJSONBody>, res) => {
    res.sendStatus(204);
  },
};
