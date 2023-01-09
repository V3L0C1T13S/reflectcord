/* eslint-disable no-redeclare */
import { RESTPostAPIGuildChannelJSONBody } from "discord.js";
import { Tuple } from "../../../utils/check";

export const ChannelCreateBody = {
  name: String,
  $permission_overwrites: [],
  $type: Number,
  $parent_id: new Tuple(String, Number),
};

export type ChannelCreateBody = RESTPostAPIGuildChannelJSONBody;
