import { Resource } from "express-automatic-routes";
import { toCompatibleISO } from "@reflectcord/common/utils";

export default () => <Resource> {
  get: (req, res) => {
    res.json({
      has_access_rate: false,
      access_rate: 1,
      last_updated: toCompatibleISO(new Date().toISOString()),
    });
  },
};
