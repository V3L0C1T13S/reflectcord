import { APIRole } from "discord.js";
import { API } from "revolt.js";
import { hexToRgbCode } from "../../utils";
import { QuarkConversion } from "../QuarkConversion";
import { toSnowflake } from "../util";
import { Permissions } from "./permissions";

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

  async from_quark(role, id?: string) {
    const { name, permissions } = role;

    return {
      name,
      id: id ? await toSnowflake(id) : "0", // FIXME
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
