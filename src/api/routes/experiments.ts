import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    res.json({ fingerprint: "", assignments: [], guild_experiments: [] });
  },
};
