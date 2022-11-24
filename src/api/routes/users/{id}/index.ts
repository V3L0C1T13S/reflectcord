import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { HTTPError } from "@reflectcord/common/utils";
import { User, fromSnowflake } from "@reflectcord/common/models";

export async function fetchUser(api: API.API, id: string) {
  const rvUser = await api.get(`/users/${id}`) as API.User;

  return User.from_quark(rvUser);
}

export async function handleGetUser(req: Request, res: Response, id: string) {
  const rvId = id !== "@me" ? await fromSnowflake(id) : "@me";

  const rvUser = await fetchUser(res.rvAPI, rvId);
  if (!rvUser) throw new HTTPError("User not found", 500);

  return res.json(rvUser);
}

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const { id } = req.params;

    if (!id) throw new HTTPError("ID not supplied", 422);

    await handleGetUser(req, res, id);
  },
};
