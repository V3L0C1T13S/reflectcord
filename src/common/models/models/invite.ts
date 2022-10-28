import { APIExtendedInvite, APIInvite, ChannelType } from "discord.js";
import { API } from "revolt.js";
import { decodeTime } from "ulid";
import { QuarkConversion } from "../QuarkConversion";
import { toSnowflake } from "../util";
import { Channel } from "./channel";

export const Invite: QuarkConversion<API.InviteResponse, APIInvite> = {
  async to_quark(invite) {
    const { code } = invite;

    return {
      type: "Server",
      code,
      server_id: invite.guild?.id ?? "0",
      server_name: invite.guild?.name ?? "fixme",
      channel_id: invite.channel?.id ?? "0",
      channel_name: invite.channel?.name ?? "fixme",
      user_name: "fixme",
      member_count: invite.approximate_member_count ?? 0,
    };
  },

  async from_quark(invite) {
    const { code } = invite;

    return {
      code,
      channel: null,
    };
  },
};

export const InviteFull: QuarkConversion<API.InviteResponse, APIExtendedInvite> = {
  async to_quark(invite) {
    return Invite.to_quark(invite);
  },

  async from_quark(invite) {
    return {
      ...await Invite.from_quark(invite),
      uses: 0,
      max_uses: 0,
      max_age: 0,
      temporary: false,
      created_at: new Date().toISOString(),
    };
  },
};
