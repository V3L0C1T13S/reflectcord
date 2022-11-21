/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { IExtensionMapField, INamespace, Root } from "protobufjs";
import util from "util";
import { HTTPError, Logger } from "../../../../../../common/utils";

const settingsSchema: INamespace = {
  nested: {
    settingsschema: {
      nested: {
        settings: {
          fields: {
            afk_timeout: {
              type: "string",
              id: 1,
            },
            allow_accessibility_detection: {
              type: "bool",
              id: 2,
            },
            animate_emoji: {
              type: "bool",
              id: 3,
            },

            contact_sync_enabled: {
              type: "bool",
              id: 5,
            },
            convert_emoticons: {
              type: "bool",
              id: 6,
            },
            default_guilds_restricted: {
              type: "bool",
              id: 8,
            },
            detect_platform_accounts: {
              type: "bool",
              id: 9,
            },
            developer_mode: {
              type: "bool",
              id: 10,
            },
          },
        },
      },
    },
  },
};

// FIXME
export default (express: Application) => <Resource> {
  get: (req, res) => {
    res.sendStatus(500);
  },
  patch: (req, res) => {
    const { required_data_version, settings } = req.body;
    if (!settings) throw new HTTPError("Invalid request");

    const dataRoot = Root.fromJSON(settingsSchema);
    const data = dataRoot.lookupType("settingsschema.settings");

    Logger.log(`${util.inspect(data.toObject(data.create(settings)), {
      depth: 0,
    })}`);

    res.sendStatus(500);
  },
};
