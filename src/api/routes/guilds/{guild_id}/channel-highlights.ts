import { Resource } from "express-automatic-routes";
import { UnimplementedError } from "@reflectcord/common/utils";

export default () => <Resource> {
  get: (req, res) => {
    throw new UnimplementedError();
  },
};
