import { Resource } from "express-automatic-routes";
import { HTTPError } from "../../../../../../common/utils";

// FIXME
export default () => <Resource> {
  get: (req, res) => {
    throw new HTTPError("Sticker not found", 404);
  },
};
