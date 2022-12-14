import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";

export default () => <Resource> {
  post: (req, res) => {
    throw new HTTPError("FIXME: Unimplemented", 500);
  },
};
