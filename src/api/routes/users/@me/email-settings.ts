/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";

export default (express: Application) => <Resource> {
  get: (req, res) => {
    res.json({
      categories: {
        social: true,
        communication: true,
        tips: false,
        updates_and_announcements: false,
        recommendations_and_events: false,
      },
      initialized: false,
    });
  },
};
