import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    res.json({
      has_access_rate: false,
      access_rate: 1,
      last_updated: new Date().toISOString(),
    });
  },
};
