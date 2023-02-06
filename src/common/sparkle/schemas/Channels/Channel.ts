/* eslint-disable no-redeclare */
import { RESTPatchAPIChannelJSONBody, RESTPostAPIGuildChannelJSONBody } from "discord.js";
import { Tuple } from "../../../utils/check";

export const ChannelCreateBody = {
  name: String,
  $permission_overwrites: [],
  $type: Number,
  $parent_id: new Tuple(String, Number),
};

export interface APIChannelPatchBody extends RESTPatchAPIChannelJSONBody {
  /**
   * Base64 encoded channel icon. Clear icon if null.
  */
  icon?: string | null,
}

export type ChannelCreateBody = RESTPostAPIGuildChannelJSONBody;
