import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  put: (req, res) => {
    res.sendStatus(401);
  },
};
