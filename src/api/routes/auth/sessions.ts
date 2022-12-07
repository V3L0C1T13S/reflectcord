import { SessionsResponse } from "@reflectcord/common/sparkle";
import { Response } from "express";
import { Resource } from "express-automatic-routes";
import { Session } from "@reflectcord/common/models";

export default () => <Resource> {
  get: async (req, res: Response<SessionsResponse>) => {
    const rvSessions = await res.rvAPI.get("/auth/session/all");

    res.json({
      user_sessions: await Promise.all(rvSessions.map((x) => Session.from_quark(x))),
    });
  },
};
