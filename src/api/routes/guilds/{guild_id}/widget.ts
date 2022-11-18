import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";

export default () => <Resource> {
  get: (req, res) => {
    res.json({ enabled: false, channel_id: null });
  },
  patch: (req, res) => {
    throw new HTTPError("Unimplemented", 401);
  },
};
