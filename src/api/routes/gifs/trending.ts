import { Application } from "express";
import { Resource } from "express-automatic-routes";

export default (express: Application) => <Resource> {
  get: (req, res) => {
    res.json({
      categories: [{
        name: "fixme",
        image: "http://0.0.0.0",
      }],
      gifs: [],
    });
  },
};
