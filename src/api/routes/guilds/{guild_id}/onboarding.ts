import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    res.json({});
  },
  put: (req, res) => res.sendStatus(204),
};
