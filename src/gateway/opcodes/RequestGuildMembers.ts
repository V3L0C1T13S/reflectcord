/* eslint-disable camelcase */
import { GatewayRequestGuildMembersData } from "discord.js";
import { Payload } from "../util";
import { fromSnowflake } from "../../common/models/util";
import { Logger } from "../../common/utils";
import { WebSocket } from "../Socket";

export async function RequestGuildMembers(
  this: WebSocket,
  data: Payload<GatewayRequestGuildMembersData>,
) {
  if (!data.d) return;

  const { guild_id } = data.d;

  // const rvId = await fromSnowflake(guild_id);
}
