/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: async (req, res) => {
    res.json({
      consent_required: false,
      country_code: 0,
      promotional_email_opt_in: { required: true, pre_checked: false },
    });
  },
};
