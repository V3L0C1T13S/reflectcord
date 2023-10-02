import {
  APIOverwrite, APIRole, PermissionFlagsBits, PermissionsBitField,
} from "discord.js";

export function calculateRolePermissions(
  roles: APIRole[],
) {
  const permissions = new PermissionsBitField(roles.map((x) => x.permissions.toBigInt()));

  if (permissions.has(PermissionFlagsBits.Administrator)) {
    return new PermissionsBitField(PermissionsBitField.All);
  }

  return permissions;
}

export function calculateMemberPermissions(
  roles: APIRole[],
  overwrites: APIOverwrite[],
) {
  const permissions = calculateRolePermissions(roles);

  if (permissions.has(PermissionFlagsBits.Administrator)) return permissions;

  return permissions
    .remove(overwrites.map((role) => role.deny.toBigInt()))
    .add(overwrites.map((role) => role.allow.toBigInt()));
}
