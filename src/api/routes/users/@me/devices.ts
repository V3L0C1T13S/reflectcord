import { Resource } from "express-automatic-routes";

// FIXME
export default () => <Resource> {
  post: (req, res) => {
    res.sendStatus(204);
  },
};
