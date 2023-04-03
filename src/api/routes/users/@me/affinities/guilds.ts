/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    res.json({ guild_affinities: [], inverse_guild_affinities: [] });
  },
};
