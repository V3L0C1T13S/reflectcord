/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  delete: async (req, res) => {
    res.sendStatus(204);
  },
};
