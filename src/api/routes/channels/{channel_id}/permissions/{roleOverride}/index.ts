/* eslint-disable camelcase */
import { OverwriteType } from "discord.js";
import { Resource } from "express-automatic-routes";
import { fromSnowflake, Permissions } from "@reflectcord/common/models";
import { HTTPError } from "@reflectcord/common/utils";

// FIXME
export default () => <Resource> {
  put: async (req, res) => {
    const { channel_id, roleOverride } = req.params;

    if (!roleOverride || !channel_id) throw new HTTPError("Invalid params");

    const rvChannelId = await fromSnowflake(channel_id);
    let roleId = await fromSnowflake(roleOverride);

    // FIXME: Member overrides are unsupported by Revolt
    if (req.body.type !== OverwriteType.Role) throw new HTTPError("Invalid type");

    const rvChannel = await res.rvAPIWrapper.channels.fetch(rvChannelId);
    if (!("guild_id" in rvChannel.discord)) throw new HTTPError("Invalid channel", 400);
    if (rvChannel.discord.guild_id === roleOverride) {
      roleId = "default";
    }

    const allow = BigInt(req.body.allow);
    const deny = BigInt(req.body.deny);

    const rvAllow = await Permissions.to_quark(allow);
    const rvDeny = await Permissions.to_quark(deny);

    await res.rvAPI.put(`/channels/${rvChannelId as ""}/permissions/${roleId as ""}`, {
      permissions: {
        allow: rvAllow.a,
        deny: rvDeny.a,
      },
    });

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
