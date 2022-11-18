/* eslint-disable camelcase */
import { Application } from "express";
import { Resource } from "express-automatic-routes";
import { HTTPError } from "@reflectcord/common/utils";
import { fromSnowflake, InviteCreate } from "@reflectcord/common/models";

// FIXME
export default (express: Application) => <Resource> {
  post: async (req, res) => {
    const { channel_id } = req.params;

    if (!channel_id) throw new HTTPError("Invalid params");

    const rvChannel = await fromSnowflake(channel_id);

    const rvInvite = await res.rvAPI.post(`/channels/${rvChannel as ""}/invites`);
    if (rvInvite.type !== "Server") throw new HTTPError("Revolt returned invalid invite type");

    res.json(await InviteCreate.from_quark(rvInvite));
  },
  get: async (req, res) => {
    res.json([]);
  },
};
