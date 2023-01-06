/* eslint-disable no-redeclare */
import { APIAllowedMentions } from "discord.js";

export const AllowedMentions = {
  $parse: [String],
  $roles: [String],
  $users: [String],
  $replied_user: Boolean,
};

export type AllowedMentions = APIAllowedMentions;
