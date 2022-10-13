import { APIApplication } from "discord.js";
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    res.status(500).json({
      code: 500,
      message: "FIXME! Route unimpl.",
    });
  },
  post: async (req, res) => {
    res.status(500).json({
      code: 500,
      message: "FIXME! Route unimpl.",
    });
  },
};
