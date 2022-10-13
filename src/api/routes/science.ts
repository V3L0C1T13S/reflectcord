import { Application, Request } from "express";
import { Resource } from "express-automatic-routes";

export type TrackingRequest = {
  headers: {
    "X-Super-Properties": string,
  }
}

export default (express: Application) => <Resource> {
  post: (req, res) => {
    const trackerData = req.headers["X-Super-Properties"];
    if (!trackerData || typeof trackerData !== "string") return res.sendStatus(504);

    const trackingData = Buffer.from(trackerData, "base64").toString("utf8");

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(trackingData));

    return res.sendStatus(200);
  },
};
