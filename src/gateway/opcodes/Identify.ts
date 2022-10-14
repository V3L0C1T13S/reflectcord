/* eslint-disable no-plusplus */
import { GatewayCloseCodes, GatewayDispatchEvents, GatewayOpcodes } from "discord.js";
import { startListener } from "../util/Listener";
import { Send, Payload } from "../util";
import { WebSocket } from "../Socket";

export async function onIdentify(this: WebSocket, data: Payload) {
  clearTimeout(this.readyTimeout);

  console.log("Identifying");

  const identify = data.d;

  const { token } = identify;

  if (!token) {
    console.error(`Invalid token ${token}`);
    return this.close(GatewayCloseCodes.AuthenticationFailed);
  }

  const readyData = {
    v: 8,
    application: { id: "1" },
    user: { id: "1" },
    guilds: [],
  };

  await Send(this, {
    op: GatewayOpcodes.Dispatch,
    t: GatewayDispatchEvents.Ready,
    s: this.sequence++,
    d: readyData,
  });

  await startListener.call(this);
}
