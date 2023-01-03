import { Resource } from "express-automatic-routes";
import { UnimplementedError } from "@reflectcord/common/utils";

export default () => <Resource> {
  get: (req, res) => {
    res.json([]);
  },
  post: (req, res) => {
    throw new UnimplementedError();
  },
  put: (req, res) => {
    throw new UnimplementedError();
  },
};
