import { Resource } from "express-automatic-routes";

// FIXME
export default () => <Resource> {
  get: (req, res) => {
    res.sendStatus(404);
  },
};
