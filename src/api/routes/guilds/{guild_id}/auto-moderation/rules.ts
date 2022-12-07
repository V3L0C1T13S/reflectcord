/* eslint-disable camelcase */
import { RulesResponse, RulesPOST } from "@reflectcord/common/sparkle";
import { Response } from "express";
import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    res.sendStatus(404);
  },
  post: (req, res: Response<RulesResponse>) => {
    const {
      guild_id, id, creator_id, name, event_type,
    } = req.body as RulesPOST;

    res.json(req.body);
  },
};
