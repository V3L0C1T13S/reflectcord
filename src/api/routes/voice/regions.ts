/* eslint-disable camelcase */
import { Application, Response } from "express";
import { Resource } from "express-automatic-routes";

// FIXME
export default () => <Resource> {
  get: async (req, res: Response) => {
    res.json([{
      id: "0",
      name: "United States",
      custom: null,
      deprecated: false,
      optimal: null,
    }]);
  },
};
