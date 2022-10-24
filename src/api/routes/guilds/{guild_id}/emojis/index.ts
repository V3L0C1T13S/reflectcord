/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    const { guild_id } = req.params;
  },
};
