import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  patch: (req, res) => {
    res.sendStatus(404);
  },
};
