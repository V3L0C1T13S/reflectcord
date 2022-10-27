/* eslint-disable camelcase */
import { ChannelType, OverwriteType } from "discord.js";
import { Request } from "express";
import { Resource } from "express-automatic-routes";
import { API } from "revolt.js";
import { fromSnowflake } from "../../../../../../common/models/util";
import { HTTPError } from "../../../../../../common/utils";

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
