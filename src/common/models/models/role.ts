import { APIRole, PermissionsBitField } from "discord.js";
import { API, Permission } from "revolt.js";
import { hexToRgbCode, Logger } from "../../utils";
import { QuarkConversion } from "../QuarkConversion";
import { bitwiseAndEq, Permissions } from "./permissions";

export const Role: QuarkConversion<API.Role, APIRole> = {
  async to_quark(role) {
    const { name, id } = role;

    return {
      name,
      _id: id,
      permissions: {
        a: 0,
        d: 0,
      },
    };
  },

  async from_quark(role) {
    const { name, permissions } = role;

    return {
      name,
      id: "0", // FIXME
      permissions: await (async () => {
        const perms = await Permissions.from_quark(permissions);

        return perms.toString();
      })(),
      color: role.colour ? hexToRgbCode(role.colour) ?? 0 : 0,
      hoist: role.hoist ?? false,
      position: role.rank ?? 0,
      managed: false,
      mentionable: false,
    };
  },
};
