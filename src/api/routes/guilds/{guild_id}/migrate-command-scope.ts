import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    res.json({
      integration_ids_with_app_commands: [],
    });
  },
};
