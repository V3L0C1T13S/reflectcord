import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { enableTracking } from "@reflectcord/common/constants";

export type TrackingRequest = {
  headers: {
    "X-Super-Properties": string,
  }
}

export default (express: Application) => <Resource> {
  post: (req, res) => {
    if (!enableTracking) return res.sendStatus(204);

    const { events } = req.body;

    return res.sendStatus(204);
  },
};
