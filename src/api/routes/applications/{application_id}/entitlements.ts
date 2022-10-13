/* eslint-disable camelcase */
import { APIApplication } from "discord.js";
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { Application as botApplication } from "../../../../common/models";
import { createAPI } from "../../../../common/rvapi";

export default (express: Application) => <Resource> {
  get: (req, res) => {
    res.status(200).send([]);
  },
};
