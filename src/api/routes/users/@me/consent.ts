import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    res.json({
      personalization: {
        consented: true,
      },
      usage_statics: {
        consented: true,
      },
    });
  },
  post: (req, res) => {
    res.sendStatus(500);
  },
};
