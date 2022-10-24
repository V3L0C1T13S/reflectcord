import { PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { API, Permission } from "revolt.js";
import Long from "long";
import { QuarkConversion } from "../QuarkConversion";

export const PermsMap: Record<number, keyof typeof PermissionFlagsBits> = {
  [Permission.AssignRoles]: "ManageRoles",
  [Permission.BanMembers]: "BanMembers",
  [Permission.ChangeNickname]: "ChangeNickname",
  [Permission.Connect]: "Connect",
  [Permission.DeafenMembers]: "DeafenMembers",
  [Permission.GrantAllSafe]: "Administrator",
  [Permission.InviteOthers]: "CreateInstantInvite",
  [Permission.KickMembers]: "KickMembers",
  [Permission.ManageChannel]: "ManageChannels",
  [Permission.ManageCustomisation]: "ManageEmojisAndStickers",
  [Permission.ManageMessages]: "ManageMessages",
  [Permission.ManageNicknames]: "ManageNicknames",
  [Permission.ManageRole]: "ManageRoles",
  [Permission.ManageServer]: "ManageGuild",
  [Permission.ManageWebhooks]: "ManageWebhooks",
  [Permission.MoveMembers]: "MoveMembers",
  [Permission.MuteMembers]: "MuteMembers",
  [Permission.React]: "AddReactions",
  [Permission.ReadMessageHistory]: "ReadMessageHistory",
  [Permission.SendEmbeds]: "EmbedLinks",
  [Permission.SendMessage]: "SendMessages",
  [Permission.Speak]: "Speak",
  [Permission.TimeoutMembers]: "ModerateMembers",
  [Permission.UploadFiles]: "AttachFiles",
  [Permission.Video]: "UseVAD",
  [Permission.ViewChannel]: "ViewChannel",
};

export type rvPermission = {
  /** Allow */
  a: number;
  /** Deny */
  d: number;
}

/**
 * Check whether `b` is present in `a`
 * @param a Input A
 * @param b Inputs (OR'd together)
 */
export function bitwiseAndEq(a: number, ...b: number[]) {
  const value = b.reduce((prev, cur) => prev.or(cur), Long.fromNumber(0));
  return value.and(a).eq(value);
}

export function convertPermNumber(rvPerms: number) {
  const perms = new PermissionsBitField();

  Object.entries(PermsMap).forEach(([rvPerm, discordPerm]) => {
    if (bitwiseAndEq(rvPerms, rvPerm.toNumber())) {
      perms.add(discordPerm);
    }
  });

  return perms.bitfield;
}

export function calculatePermissions(perm: rvPermission) {
  let calculated = Long.fromNumber(0);

  calculated = calculated.or(perm.a)
    .and(Long.fromNumber(perm.d).not());

  return calculated.toNumber();
}

export function calculateRolePermission(role: API.Role) {
  return calculatePermissions(role.permissions);
}

export const Permissions: QuarkConversion<rvPermission, bigint> = {
  async to_quark(permission) {
    switch (permission) {
      case PermissionFlagsBits.AddReactions: {
        return {
          a: 1,
          d: 29,
        };
      }
      default: {
        return {
          a: 0,
          d: 0,
        };
      }
    }
  },

  async from_quark(permission) {
    const rvPerm = calculatePermissions(permission);

    return convertPermNumber(rvPerm);
  },
};
