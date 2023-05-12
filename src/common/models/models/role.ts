import { APIRole, RESTPatchAPIGuildRoleJSONBody } from "discord.js";
import { API } from "revolt.js";
import { hexToRgbCode, rgbToHex } from "../../utils";
import { QuarkConversion } from "../QuarkConversion";
import { fromSnowflake, toSnowflake } from "../util";
import { Permissions } from "./permissions";

// FIXME: This should be unhardcoded since some Revolt instances use different max roles
const maxRoleCount = 200;

export const Role: QuarkConversion<API.Role, APIRole> = {
  async to_quark(role) {
    const { name, id, permissions } = role;

    return {
      name,
      _id: await fromSnowflake(id),
      permissions: await Permissions.to_quark(BigInt(permissions)),
    };
  },

  async from_quark(role, id?: string) {
    const { name, permissions } = role;

    const discordRole: APIRole = {
      name,
      id: id ? await toSnowflake(id) : "0", // FIXME
      permissions: (await Permissions.from_quark(permissions)).toString(),
      // FIXME: gradient conversion needed
      color: role.colour ? hexToRgbCode(role.colour) || 0 : 0,
      hoist: !!role.hoist,
      // On Discord, the highest role wins, where on Revolt, it's the exact opposite.
      position: maxRoleCount - (role.rank ?? 0),
      managed: false,
      mentionable: false,
    };

    return discordRole;
  },
};

export const RoleEdit: QuarkConversion<API.DataEditRole, RESTPatchAPIGuildRoleJSONBody> = {
  async to_quark(role) {
    return {
      name: role.name ?? null,
      colour: role.color ? rgbToHex(role.color) : null,
      hoist: role.hoist ?? null,
    };
  },

  async from_quark(role) {
    return {
      name: role.name ?? null,
      colour: role.colour ? hexToRgbCode(role.colour) : null,
      hoist: role.hoist,
    };
  },
};
