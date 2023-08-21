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
  [Permission.Speak]: PermissionFlagsBits.Speak + PermissionFlagsBits.UseVAD,
  [Permission.TimeoutMembers]: PermissionFlagsBits.ModerateMembers,
  [Permission.UploadFiles]: PermissionFlagsBits.AttachFiles,
  [Permission.Video]: PermissionFlagsBits.Stream,
  [Permission.ViewChannel]: PermissionFlagsBits.ViewChannel,
};

export const DiscordPerms: Record<string, ValueOf<typeof Permission>> = {
  [PermissionFlagsBits.AddReactions.toString()]: Permission.React,
  [PermissionFlagsBits.Administrator.toString()]: Permission.GrantAllSafe,
  [PermissionFlagsBits.AttachFiles.toString()]: Permission.UploadFiles,
  [PermissionFlagsBits.BanMembers.toString()]: Permission.BanMembers,
  [PermissionFlagsBits.ChangeNickname.toString()]: Permission.ChangeNickname,
  [PermissionFlagsBits.Connect.toString()]: Permission.Connect,
  [PermissionFlagsBits.CreateInstantInvite.toString()]: Permission.InviteOthers,
  [PermissionFlagsBits.DeafenMembers.toString()]: Permission.DeafenMembers,
  [PermissionFlagsBits.EmbedLinks.toString()]: Permission.SendEmbeds,
  [PermissionFlagsBits.KickMembers.toString()]: Permission.KickMembers,
  [PermissionFlagsBits.ManageChannels.toString()]: Permission.ManageChannel,
  [PermissionFlagsBits.ManageEmojisAndStickers.toString()]: Permission.ManageCustomisation,
  [PermissionFlagsBits.ManageWebhooks.toString()]: Permission.ManageWebhooks,
  [PermissionFlagsBits.ManageGuild.toString()]: Permission.ManageServer,
  [PermissionFlagsBits.ManageMessages.toString()]: Permission.ManageMessages,
  [PermissionFlagsBits.ManageNicknames.toString()]: Permission.ManageNicknames,
  [PermissionFlagsBits.ManageRoles.toString()]: Permission.ManageRole,
  [PermissionFlagsBits.ModerateMembers.toString()]: Permission.TimeoutMembers,
  [PermissionFlagsBits.MoveMembers.toString()]: Permission.MoveMembers,
  [PermissionFlagsBits.MuteMembers.toString()]: Permission.MuteMembers,
  [PermissionFlagsBits.ReadMessageHistory.toString()]: Permission.ReadMessageHistory,
  [PermissionFlagsBits.SendMessages.toString()]: Permission.SendMessage,
  [PermissionFlagsBits.Speak.toString()]: Permission.Speak,
  [PermissionFlagsBits.Stream.toString()]: Permission.Video,
  [PermissionFlagsBits.ViewChannel.toString()]: Permission.ViewChannel,
};

// export const DiscordPermsMap = allBigintToString(PermsMap);

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

export function resolvePermissions(perms: rvPermission[]) {
  return perms.map((p) => calculatePermissions(p))
  // eslint-disable-next-line no-bitwise
    .reduce((prev, p) => prev | p, 0);
}

export function calculateRolePermission(role: API.Role) {
  return calculatePermissions(role.permissions);
}

export const Permissions: QuarkConversion<rvPermission, bigint> = {
  async to_quark(permissions) {
    const perms = new PermissionsBitField(permissions);
    let calculated = Long.fromNumber(0);

    Object.entries(DiscordPerms).forEach(([discordPerm, rvPerm]) => {
      if (perms.has(BigInt(discordPerm))) {
        calculated = calculated.or(rvPerm);
      }
    });

    return {
      a: calculated.toNumber(),
      d: 0,
    };
  },

  async from_quark(permissions) {
    const rvPerm = calculatePermissions(permissions);

    return convertPermNumber(rvPerm);
  },
};
