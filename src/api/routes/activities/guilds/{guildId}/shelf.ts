import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    res.json({
      activity_bundle_items: [{
        application_id: "880218394199220334", expires_on: null, new_until: null, nitro_requirement: false, premium_tier_level: 0, always_free: true,
      }, {
        application_id: "947957217959759964", expires_on: "2023-01-18T20:44:00+00:00", new_until: null, nitro_requirement: true, premium_tier_level: 0, always_free: false,
      }, {
        application_id: "945737671223947305", expires_on: "2023-01-18T20:44:00+00:00", new_until: null, nitro_requirement: true, premium_tier_level: 0, always_free: false,
      }, {
        application_id: "755827207812677713", expires_on: "2023-01-18T20:44:00+00:00", new_until: null, nitro_requirement: true, premium_tier_level: 0, always_free: false,
      }, {
        application_id: "902271654783242291", expires_on: "2023-01-18T20:44:00+00:00", new_until: null, nitro_requirement: true, premium_tier_level: 0, always_free: false,
      }, {
        application_id: "832012774040141894", expires_on: "2023-01-18T20:44:00+00:00", new_until: null, nitro_requirement: true, premium_tier_level: 0, always_free: false,
      }, {
        application_id: "903769130790969345", expires_on: "2023-01-18T20:44:00+00:00", new_until: null, nitro_requirement: true, premium_tier_level: 0, always_free: false,
      }, {
        application_id: "832025144389533716", expires_on: "2023-01-18T20:44:00+00:00", new_until: null, nitro_requirement: true, premium_tier_level: 0, always_free: false,
      }, {
        application_id: "852509694341283871", expires_on: "2023-01-18T20:44:00+00:00", new_until: null, nitro_requirement: true, premium_tier_level: 0, always_free: false,
      }, {
        application_id: "879863686565621790", expires_on: "2023-01-18T20:44:00+00:00", new_until: null, nitro_requirement: false, premium_tier_level: 0, always_free: false,
      }, {
        application_id: "832013003968348200", expires_on: "2023-01-18T20:44:00+00:00", new_until: null, nitro_requirement: true, premium_tier_level: 0, always_free: false,
      }],
      free_activity_app_id: "879863686565621790",
      expires_at: "2023-01-18T20:44:00+00:00",
    });
  },
};
