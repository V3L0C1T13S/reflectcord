import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { HTTPError } from "@reflectcord/common/utils";
import { User, fromSnowflake, selfUser } from "@reflectcord/common/models";

export async function fetchUser(api: API.API, id: string, genAnalyticsToken = false) {
  const rvUser = await api.get(`/users/${id as ""}`);

  if (id === "@me" && !rvUser.bot) {
    const authInfo = await api.get("/auth/account/");
    const mfaInfo = await api.get("/auth/mfa/");

    return selfUser.from_quark({
      user: rvUser,
      authInfo,
      mfaInfo,
    }, {
      genAnalyticsToken,
    });
  }

  return User.from_quark(rvUser);
}

export async function handleGetUser(req: Request, res: Response, id: string) {
  const rvId = id !== "@me" ? await fromSnowflake(id) : "@me";

  const rvUser = await fetchUser(res.rvAPI, rvId, req.query.with_analytics_token === "true");
  if (!rvUser) throw new HTTPError("User not found", 500);

  res.json(rvUser);
}

export default () => <Resource> {
  get: async (req, res) => {
    const { id } = req.params;

    if (!id) throw new HTTPError("ID not supplied", 422);

    await handleGetUser(req, res, id);
  },
};
