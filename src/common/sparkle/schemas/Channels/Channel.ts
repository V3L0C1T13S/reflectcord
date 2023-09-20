/* eslint-disable no-redeclare */
import {
  APIDMChannel, APIGroupDMChannel, RESTPatchAPIChannelJSONBody, RESTPostAPIGuildChannelJSONBody,
} from "discord.js";
import { Tuple } from "../../../utils/check";

export const ChannelCreateBody = {
  name: String,
  $permission_overwrites: [],
  $type: Number,
  $parent_id: new Tuple(String, Number),
  $nsfw: Boolean,
  $topic: String,
  $bitrate: Number,
  $user_limit: Number,
  $position: Number,
  $rtc_region: String,
};

export interface APIChannelPatchBody extends RESTPatchAPIChannelJSONBody {
  /**
   * Base64 encoded channel icon. Clear icon if null.
  */
  icon?: string | null,
}

export type ChannelCreateBody = RESTPostAPIGuildChannelJSONBody;

export type APIPrivateChannel = APIDMChannel | APIGroupDMChannel;
