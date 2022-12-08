import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  put: (req, res) => {
    res.sendStatus(204);
  },
  patch: (req, res) => {
    res.sendStatus(204);
  },
};
