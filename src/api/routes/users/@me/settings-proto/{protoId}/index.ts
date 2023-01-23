/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import {
  createSettingsSyncPOST,
  SettingsKeys, settingsProtoToJSON, settingsToProtoBuf, UserSettings,
} from "@reflectcord/common/models";
import { HTTPError, Logger } from "@reflectcord/common/utils";

export default () => <Resource> {
  get: async (req, res) => {
    switch (req.params.protoId!) {
      case "1": {
        const rvSettings = await res.rvAPI.post("/sync/settings/fetch", {
          keys: SettingsKeys,
        });

        const settings = await UserSettings.from_quark(rvSettings);

        const proto = await settingsToProtoBuf(settings);

        res.send(Buffer.from(proto).toString("base64"));

        break;
      }
      default: {
        res.sendStatus(500);
        break;
      }
    }
  },
  patch: async (req, res) => {
    const { settings } = req.body;
    const { protoId } = req.params;

    if (!settings) throw new HTTPError("Invalid settings");

    const settingsData = Buffer.from(settings, "base64");

    const settingsJSON = await settingsProtoToJSON(settingsData);

    switch (protoId) {
      case "1": {
        const revoltSettings = await UserSettings.to_quark(settingsJSON);

        const discordSettings = await UserSettings.from_quark(revoltSettings);
        const updatedProto = await settingsToProtoBuf(discordSettings);
        const settingsPOST = createSettingsSyncPOST(revoltSettings);

        await res.rvAPI.post("/sync/settings/set", settingsPOST);

        res.json({
          settings: Buffer.from(updatedProto).toString("base64"),
        });
        break;
      }
      default: {
        Logger.warn(`unhandled proto ${protoId}`);
        res.sendStatus(500);
      }
    }
  },
};
