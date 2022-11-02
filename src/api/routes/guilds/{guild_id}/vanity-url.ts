import { Resource } from "express-automatic-routes";
import { HTTPError } from "../../../../common/utils";

export default () => <Resource> {
  get: (req, res) => {
    res.json({ code: null });
  },
  patch: (req, res) => {
    throw new HTTPError("Guild doesn't support vanity URLs");
  },
};
