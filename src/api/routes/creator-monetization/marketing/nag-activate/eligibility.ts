import { Resource } from "express-automatic-routes";
import { UnimplementedError } from "@reflectcord/common/utils";

export default () => <Resource> {
  get: () => {
    throw new UnimplementedError();
  },
};
