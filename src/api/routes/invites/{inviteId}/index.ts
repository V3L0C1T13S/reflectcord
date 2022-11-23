import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { Invite } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

export default (express: Application) => <Resource> {
  get: async (req, res) => {
    const { inviteId } = req.params;

    if (!inviteId) throw new HTTPError("Invalid ID");

    const revoltInvite = await res.rvAPI.get(`/invites/${inviteId as ""}`);

    res.json(await Invite.from_quark(revoltInvite));
  },
  post: async (req, res) => {
    const { inviteId } = req.params;

    if (!inviteId) throw new HTTPError("Invalid ID");

    const revoltInvite = await res.rvAPI.get(`/invites/${inviteId as ""}`);
    await res.rvAPI.post(`/invites/${inviteId as ""}`);

    res.json(await Invite.from_quark(revoltInvite));
  },
  delete: async (req, res) => {
    const { inviteId } = req.params;

    if (!inviteId) throw new HTTPError("Invalid ID");

    const revoltInvite = await res.rvAPI.get(`/invites/${inviteId as ""}`);
    await res.rvAPI.delete(`/invites/${inviteId}`);

    res.json(await Invite.from_quark(revoltInvite));
  },
};
