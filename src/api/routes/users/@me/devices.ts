import { Resource } from "express-automatic-routes";

// STUB
export default () => <Resource> {
  post: (req, res) => {
    res.sendStatus(204);
  },
};
