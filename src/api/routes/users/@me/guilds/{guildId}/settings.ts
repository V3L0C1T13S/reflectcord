import { Resource } from "express-automatic-routes";
import { SettingsKeys } from "@reflectcord/common/models";
import { UnimplementedError } from "@reflectcord/common/utils";

export default () => <Resource> {
  patch: async (req, res) => {
    const currentSettings = await res.rvAPI.post("/sync/settings/fetch", {
      keys: SettingsKeys,
    });

    throw new UnimplementedError();
  },
};
