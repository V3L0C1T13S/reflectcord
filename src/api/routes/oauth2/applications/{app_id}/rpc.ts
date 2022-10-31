import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    res.sendStatus(500);
  },

  post: (req, res) => {
    res.sendStatus(500);
  },
};
