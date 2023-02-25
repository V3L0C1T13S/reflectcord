import { Resource } from "express-automatic-routes";
import { Request } from "express";
import { RESTPostAPIInteractionCallbackJSONBody } from "discord.js";
import { UnimplementedError } from "@reflectcord/common/utils";

export default () => <Resource> {
  post: async (req: Request<{}, RESTPostAPIInteractionCallbackJSONBody>, res) => {
    throw new UnimplementedError();
  },
};
