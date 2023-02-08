/* eslint-disable camelcase */
import { APIUserSettingsPATCHResponse, UserSettings as DiscordUserSettings } from "@reflectcord/common/sparkle";
import {
  createSettingsSyncPOST, RevoltSettings, SettingsKeys, UserSettings,
} from "@reflectcord/common/models";
import { Response } from "express";
import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  patch: async (req, res: Response<APIUserSettingsPATCHResponse>) => {
    const current = await res.rvAPI.post("/sync/settings/fetch", {
      keys: SettingsKeys,
    });

    const merged = {
      ...current,
      ...await UserSettings.to_quark(req.body),
    };

    await res.rvAPI.post("/sync/settings/set", createSettingsSyncPOST(merged));

    res.json({
      ...await UserSettings.from_quark(merged),
      index: undefined,
    });
  },
  get: async (req, res: Response<DiscordUserSettings>) => {
    const settings = await res.rvAPI.post("/sync/settings/fetch", {
      keys: SettingsKeys,
    }) as unknown as RevoltSettings;

    res.json(await UserSettings.from_quark(settings));
  },
};
