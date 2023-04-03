import { Resource } from "express-automatic-routes";
import { FieldErrors } from "@reflectcord/common/utils";

// FIXME
export default () => <Resource> {
  post: (req, res) => {
    throw FieldErrors({
      password: {
        message: "Not implemented.",
        code: "INVALID_PASSWORD",
      },
    });
  },
};
