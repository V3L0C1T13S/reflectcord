/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import { GatewayOpcodes } from "discord.js";
import { setHeartbeat } from "../util/Heartbeat";
import { Send, Payload } from "../util";
import { WebSocket } from "../Socket";

export async function lazyReq(this: WebSocket, data: Payload) {
  const {
    guild_id, typing, channels, activities,
  } = data.d;

  console.log(JSON.stringify(channels));

  const channel_id = Object.keys(channels)[0];
  if (!channel_id) return;

  const ranges = channels![channel_id];
  if (!Array.isArray(ranges)) throw new Error("Not a valid Array");

  const member_count = 1000;
  const ops = [];

  const groups: any[] = [];

  return Send(this, {
    op: GatewayOpcodes.Dispatch,
    s: this.sequence++,
    t: "GUILD_MEMBER_LIST_UPDATE",
    d: {
      ops: [{
        items: [],
        op: "SYNC",
        range: 0,
      }],
      online_count: 0,
      member_count,
      id: "everyone",
      guild_id,
      groups,
    },
  });
}
