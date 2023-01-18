import { Resource } from "express-automatic-routes";
import { toSnowflake } from "@reflectcord/common/models";
import { toCompatibleISO } from "@reflectcord/common/utils";

// STUB
export default () => <Resource> {
  get: async (req, res) => {
    const dateStub = toCompatibleISO(new Date().toISOString());
    const userId = await res.rvAPIWrapper.users.getSelfId();

    res.json({
      harvest_id: "0",
      user_id: await toSnowflake(userId),
      status: 3,
      created_at: dateStub,
      completed_at: dateStub,
      polled_at: dateStub,
    });
  },
};
