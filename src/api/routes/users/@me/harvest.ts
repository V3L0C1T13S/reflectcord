import { Resource } from "express-automatic-routes";

// STUB
export default () => <Resource> {
  get: (req, res) => {
    res.sendStatus(204);
  },
};
