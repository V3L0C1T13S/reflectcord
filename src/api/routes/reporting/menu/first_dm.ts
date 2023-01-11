import { Resource } from "express-automatic-routes";

// Staff route
export default () => <Resource> {
  get: (req, res) => {
    res.sendStatus(401);
  },
};
