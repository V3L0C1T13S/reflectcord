import API from "revolt-api";
import { Permission } from "revolt.js";
import { BitField } from "discord.js";
import { rvPermission } from "../types";

export function calculateRevoltMemberPermissions(
  roles: API.Role[],
  overrides: rvPermission[],
  defaultPermissions = 0,
) {
  const permissions = new BitField(defaultPermissions);
  permissions.remove(roles.map((x) => x.permissions.d))
    .add(roles.map((x) => x.permissions.a));
  if (permissions.has(Permission.GrantAllSafe)) {
    return permissions;
  }

  return permissions
    .remove(overrides.map((x) => x.d))
    .add(overrides.map((x) => x.a));
}
