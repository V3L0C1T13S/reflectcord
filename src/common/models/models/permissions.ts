import { PermissionFlags, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { API, Permission } from "revolt.js";
import Long from "long";
import { QuarkConversion } from "../QuarkConversion";

export const PermsMap: { [key: string]: typeof Permission } = {};

export type rvPermission = {
  a: number;
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

// FIXME: Unclean as hell.
export function convertPermNumber(rvPerms: number) {
  const perms = new PermissionsBitField();

  if (bitwiseAndEq(rvPerms, Permission.AssignRoles)) perms.add("ManageRoles");
  if (bitwiseAndEq(rvPerms, Permission.BanMembers)) perms.add("BanMembers");
  if (bitwiseAndEq(rvPerms, Permission.ChangeNickname)) perms.add("ChangeNickname");
  if (bitwiseAndEq(rvPerms, Permission.Connect)) perms.add("Connect");
  if (bitwiseAndEq(rvPerms, Permission.DeafenMembers)) perms.add("DeafenMembers");
  if (bitwiseAndEq(rvPerms, Permission.GrantAllSafe)) perms.add("Administrator");
  if (bitwiseAndEq(rvPerms, Permission.InviteOthers)) perms.add("CreateInstantInvite");
  if (bitwiseAndEq(rvPerms, Permission.KickMembers)) perms.add("KickMembers");
  if (bitwiseAndEq(rvPerms, Permission.ManageChannel)) perms.add("ManageChannels");
  if (bitwiseAndEq(rvPerms, Permission.ManageCustomisation)) perms.add("ManageEmojisAndStickers");
  if (bitwiseAndEq(rvPerms, Permission.ManageMessages)) perms.add("ManageMessages");
  if (bitwiseAndEq(rvPerms, Permission.ManageNicknames)) perms.add("ManageNicknames");
  if (bitwiseAndEq(rvPerms, Permission.ManageRole)) perms.add("ManageRoles");
  if (bitwiseAndEq(rvPerms, Permission.ManageServer)) perms.add("ManageGuild");
  if (bitwiseAndEq(rvPerms, Permission.ManageWebhooks)) perms.add("ManageWebhooks");
  if (bitwiseAndEq(rvPerms, Permission.MoveMembers)) perms.add("MoveMembers");
  if (bitwiseAndEq(rvPerms, Permission.MuteMembers)) perms.add("MuteMembers");
  if (bitwiseAndEq(rvPerms, Permission.React)) perms.add("AddReactions");
  if (bitwiseAndEq(rvPerms, Permission.ReadMessageHistory)) perms.add("ReadMessageHistory");
  if (bitwiseAndEq(rvPerms, Permission.SendEmbeds)) perms.add("EmbedLinks");
  if (bitwiseAndEq(rvPerms, Permission.SendMessage)) perms.add("SendMessages");
  if (bitwiseAndEq(rvPerms, Permission.Speak)) perms.add("Speak");
  if (bitwiseAndEq(rvPerms, Permission.UploadFiles)) perms.add("AttachFiles");
  if (bitwiseAndEq(rvPerms, Permission.Video)) perms.add("UseVAD");
  if (bitwiseAndEq(rvPerms, Permission.ViewChannel)) perms.add("ViewChannel");

  return perms.bitfield;
}

export function calculateRolePermission(role: API.Role) {
  let perm = Long.fromNumber(0);

  perm = perm.or(role.permissions.a)
    .and(Long.fromNumber(role.permissions.d).not());

  return perm.toNumber();
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
    const rvPerm = permission.a;

    return convertPermNumber(rvPerm);
  },
};
