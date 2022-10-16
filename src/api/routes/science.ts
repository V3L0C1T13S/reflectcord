import { Application } from "express";
import { Resource } from "express-automatic-routes";

export type TrackingRequest = {
  headers: {
    "X-Super-Properties": string,
  }
}

export default (express: Application) => <Resource> {
  post: (req, res) => {
    const { events } = req.body;

    res.sendStatus(204);
  },
};
