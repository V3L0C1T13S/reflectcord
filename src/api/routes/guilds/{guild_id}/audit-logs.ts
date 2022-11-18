import { Resource } from "express-automatic-routes";

export default () => <Resource> {
  get: (req, res) => {
    res.json({
      audit_log_entries: [],
      users: [],
      integrations: [],
      webhooks: [],
      guild_scheduled_events: [],
      threads: [],
      application_commands: [],
    });
  },
};
