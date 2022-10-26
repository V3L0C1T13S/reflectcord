/* eslint-disable camelcase */
import { GatewayRequestGuildMembersData } from "discord.js";
import { Payload } from "gateway/util";
import { Logger } from "../../common/utils";
import { WebSocket } from "../Socket";

export function RequestGuildMembers(
  this: WebSocket,
  data: Payload<GatewayRequestGuildMembersData>,
) {
  if (!data.d) return;

  const { guild_id } = data.d;
}
