import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  post: (req, res) => {
    res.sendStatus(500);
  },
};
