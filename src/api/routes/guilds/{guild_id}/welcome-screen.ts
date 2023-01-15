import { Resource } from "express-automatic-routes";
import { FieldError } from "@reflectcord/common/utils";

export default () => <Resource> {
  get: (req, res) => {
    throw new FieldError(10069, "Unknown Guild Welcome Screen");
  },
  patch: (req, res) => {
    res.json({
      description: req.body.description ?? null,
      welcome_channels: req.body.welcome_channels ?? [],
    });
  },
};
