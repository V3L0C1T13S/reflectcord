import { APIRole } from "discord.js";
import { API } from "revolt.js";
import { QuarkConversion } from "../QuarkConversion";

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
    const { name } = role;

    return {
      name,
      id: "0", // FIXME
      permissions: "0",
      color: 0,
      hoist: role.hoist ?? false,
      position: role.rank ?? 0,
      managed: false,
      mentionable: false,
    };
  },
};
