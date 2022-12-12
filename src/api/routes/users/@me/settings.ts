/* eslint-disable camelcase */
import { UserSettings as DiscordUserSettings } from "@reflectcord/common/sparkle";
import { RevoltSettings, SettingsKeys, UserSettings } from "@reflectcord/common/models";
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";

// FIXME
export default (express: Application) => <Resource> {
  patch: (req, res: Response<DiscordUserSettings>) => {
    res.sendStatus(204);
  },
  get: async (req, res: Response<DiscordUserSettings>) => {
    const settings = await res.rvAPI.post("/sync/settings/fetch", {
      keys: SettingsKeys,
    }) as unknown as RevoltSettings;

    res.json(await UserSettings.from_quark(settings));
  },
};
