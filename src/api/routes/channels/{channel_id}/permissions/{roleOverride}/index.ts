/* eslint-disable camelcase */
import { OverwriteType } from "discord.js";
import { Resource } from "express-automatic-routes";
import { fromSnowflake } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

// FIXME
export default () => <Resource> {
  put: async (req, res) => {
    const { channel_id, roleOverride } = req.params;

    if (!roleOverride || !channel_id) throw new HTTPError("Invalid params");

    const rvChannelId = await fromSnowflake(channel_id);
    const roleId = await fromSnowflake(roleOverride);

    // FIXME: Member overrides are unsupported by Revolt
    if (req.body.type !== OverwriteType.Role) throw new HTTPError("Invalid type");

    // FIXME: Partial
    await res.rvAPI.put(`/channels/${rvChannelId}/permissions/${roleId}`, {});

    res.sendStatus(204);
  },
  delete: async (req, res) => {
    const { channel_id, roleOverride } = req.params;

    if (!roleOverride || !channel_id) throw new HTTPError("Invalid params");

    const rvChannelId = await fromSnowflake(channel_id);
    const roleId = await fromSnowflake(roleOverride);

    res.sendStatus(204);
  },
};
