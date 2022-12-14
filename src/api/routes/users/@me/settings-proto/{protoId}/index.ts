/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import protobuf from "protobufjs";
import { SettingsKeys, settingsToProtoBuf, UserSettings } from "@reflectcord/common/models";

// FIXME
export default (express: Application) => <Resource> {
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
    res.sendStatus(500);
  },
};
