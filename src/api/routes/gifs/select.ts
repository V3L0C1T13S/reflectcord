import { Resource } from "express-automatic-routes";

// FIXME: What is this for?
export default () => <Resource> {
  post: (req, res) => {
    res.sendStatus(204);
  },
};
