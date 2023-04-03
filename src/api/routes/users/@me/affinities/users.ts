/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    res.json({ user_affinities: [], inverse_user_affinities: [] });
  },
};
