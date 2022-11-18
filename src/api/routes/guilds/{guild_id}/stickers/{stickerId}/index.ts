import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";

// FIXME
export default () => <Resource> {
  get: (req, res) => {
    throw new HTTPError("Sticker not found", 404);
  },
};
