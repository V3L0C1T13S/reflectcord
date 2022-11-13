import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    res.json({
      activity_bundle_items: [],
      free_activity_app_id: null,
      expires_at: null,
    });
  },
};
