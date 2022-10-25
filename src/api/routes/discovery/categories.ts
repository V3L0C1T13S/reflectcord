import { Application } from "express";
import { Resource } from "express-automatic-routes";

export default (express: Application) => <Resource> {
  get: (req, res) => {
    res.json([
      {
        id: 0,
        is_primary: true,
        name: "General",
      },
      {
        id: 1,
        is_primary: true,
        name: "Gaming",
      },
    ]);
  },
};
