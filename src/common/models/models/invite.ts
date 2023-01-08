import {
  APIExtendedInvite, APIInvite, APIUser,
} from "discord.js";
import { API } from "revolt.js";
import { QuarkConversion } from "../QuarkConversion";
import { PartialChannel } from "./channel";
import { User } from "./user";
import { systemUserID } from "../../rvapi";
import { Guild } from "./guilds";

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

    const discordInvite: APIInvite = {
      code,
      channel: {
        ...await PartialChannel.from_quark({
          _id: invite.channel_id,
          channel_type: "TextChannel",
          name: invite.channel_name,
        }),
        name: invite.channel_name ?? "fixme",
      },
      inviter: await User.from_quark({
        username: invite.user_name,
        _id: systemUserID,
      }),
    };

    if (invite.type === "Server") {
      discordInvite.guild = await Guild.from_quark({
        _id: invite.server_id,
        name: invite.server_name,
        icon: invite.server_icon ?? null,
        banner: invite.server_banner ?? null,
        owner: systemUserID,
        channels: [invite.channel_id],
        default_permissions: 0,
      });
    }

    return discordInvite;
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

export type InviteCreateATQ = {};
export type InviteCreateAFQ = Partial<{
  inviter: API.User,
  discordInviter: APIUser,
}>;

export const InviteCreate: QuarkConversion<
API.Invite, APIInvite, InviteCreateATQ, InviteCreateAFQ
> = {
  async to_quark(invite) {
    const { code } = invite;

    return {
      type: "Server",
      _id: code,
      creator: invite.inviter?.id ?? "0",
      channel: invite.channel?.id ?? "0",
      server: invite.guild?.id ?? "0",
    };
  },

  async from_quark(invite, extra) {
    const { _id } = invite;

    const discordInvite: APIInvite = {
      code: _id,
      channel: {
        ...await PartialChannel.from_quark({
          _id: invite.channel,
          channel_type: "TextChannel",
        }),
        name: "fixme",
      },
      inviter: extra?.discordInviter ?? extra?.inviter
        ? await User.from_quark(extra.inviter!)
        : await User.from_quark({
          username: "fixme",
          _id: invite.creator,
        }),
    };

    if (invite.type === "Server") {
      discordInvite.guild = await Guild.from_quark({
        _id: invite.server,
        name: "fixme",
        owner: systemUserID,
        channels: [invite.channel],
        default_permissions: 0,
      });
    }

    return discordInvite;
  },
};
