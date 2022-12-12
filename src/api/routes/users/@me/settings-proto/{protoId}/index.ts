/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import protobuf from "protobufjs";

// FIXME
export default (express: Application) => <Resource> {
  get: async (req, res) => {
    switch (req.params.protoId!) {
      case "1": {
        const root = await protobuf.load("resources/PreloadedUserSettings.proto");

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
