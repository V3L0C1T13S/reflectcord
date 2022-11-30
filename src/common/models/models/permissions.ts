import { PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { API, Permission } from "revolt.js";
import Long from "long";
import { QuarkConversion } from "../QuarkConversion";

type ValueOf<T> = T[keyof T];

// eslint-disable-next-line no-use-before-define, max-len
const allBigintToString = <T extends Record<string | number | symbol, S>, S extends bigint>(obj: T) => {
  const res = {} as any;
  Object.entries(obj).forEach(([key, value]) => {
    res[`${value}`] = key;
  });
  return res as { [K in keyof T as string]: number };
};

export const PermsMap: Record<number, ValueOf<typeof PermissionFlagsBits>> = {
  [Permission.AssignRoles]: PermissionFlagsBits.ManageRoles,
  [Permission.BanMembers]: PermissionFlagsBits.BanMembers,
  [Permission.ChangeNickname]: PermissionFlagsBits.ChangeNickname,
  [Permission.Connect]: PermissionFlagsBits.Connect,
  [Permission.DeafenMembers]: PermissionFlagsBits.DeafenMembers,
  [Permission.GrantAllSafe]: PermissionFlagsBits.Administrator,
  [Permission.InviteOthers]: PermissionFlagsBits.CreateInstantInvite,
  [Permission.KickMembers]: PermissionFlagsBits.KickMembers,
  [Permission.ManageChannel]: PermissionFlagsBits.ManageChannels,
  [Permission.ManageCustomisation]: PermissionFlagsBits.ManageEmojisAndStickers,
  [Permission.ManageMessages]: PermissionFlagsBits.ManageMessages,
  [Permission.ManageNicknames]: PermissionFlagsBits.ManageNicknames,
  [Permission.ManageRole]: PermissionFlagsBits.ManageRoles,
  [Permission.ManageServer]: PermissionFlagsBits.ManageGuild,
  [Permission.ManageWebhooks]: PermissionFlagsBits.ManageWebhooks,
  [Permission.MoveMembers]: PermissionFlagsBits.MoveMembers,
  [Permission.MuteMembers]: PermissionFlagsBits.MuteMembers,
  [Permission.React]: PermissionFlagsBits.AddReactions + PermissionFlagsBits.UseExternalEmojis,
  [Permission.ReadMessageHistory]: PermissionFlagsBits.ReadMessageHistory,
  [Permission.SendEmbeds]: PermissionFlagsBits.EmbedLinks,
  [Permission.SendMessage]: PermissionFlagsBits.SendMessages,
  [Permission.Speak]: PermissionFlagsBits.Speak,
  [Permission.TimeoutMembers]: PermissionFlagsBits.ModerateMembers,
  [Permission.UploadFiles]: PermissionFlagsBits.AttachFiles,
  [Permission.Video]: PermissionFlagsBits.UseVAD,
  [Permission.ViewChannel]: PermissionFlagsBits.ViewChannel,
};

export const DiscordPermsMap = allBigintToString(PermsMap);

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
