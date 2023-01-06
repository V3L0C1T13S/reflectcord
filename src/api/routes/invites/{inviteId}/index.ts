import { Application, Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { Invite } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

export async function getInvite(req: Request, res: Response) {
  const { inviteId } = req.params;

  if (!inviteId) throw new HTTPError("Invalid ID");

  const revoltInvite = await res.rvAPI.get(`/invites/${inviteId as ""}`);

  res.json(await Invite.from_quark(revoltInvite));
}

export async function handleDeleteInvite(req: Request, res: Response) {
  const { inviteId } = req.params;

  if (!inviteId) throw new HTTPError("Invalid ID");

  const revoltInvite = await res.rvAPI.get(`/invites/${inviteId as ""}`);
  await res.rvAPI.delete(`/invites/${inviteId}`);

  res.json(await Invite.from_quark(revoltInvite));
}

export default (express: Application) => <Resource> {
  get: (req, res) => getInvite(req, res),
  post: async (req, res) => {
    const { inviteId } = req.params;

    if (!inviteId) throw new HTTPError("Invalid ID");

    const revoltInvite = await res.rvAPI.get(`/invites/${inviteId as ""}`);
    await res.rvAPI.post(`/invites/${inviteId as ""}`);

    res.json(await Invite.from_quark(revoltInvite));
  },
  delete: async (req, res) => handleDeleteInvite(req, res),
};
